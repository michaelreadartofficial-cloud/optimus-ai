// Fetch an Instagram creator's reels via mediacrawlers'
// instagram-api-fast-reliable-data-scraper product (Ultra tier).
//
// Endpoint probe confirmed:
//   /user_id_by_username?username=X   → { UserID, UserName }
//   /reels?user_id=X                  → user's reels (Ultra required)
//
// Ultra tier is rate limited to 1 request/second. When we need to make two
// back-to-back calls (lookup + reels), we sleep 1100ms between them.

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
const RATE_LIMIT_DELAY_MS = 1100;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { username, userId: providedUserId, limit, debug } = req.body || {};

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  if (!username && !providedUserId) return res.status(400).json({ error: "Provide username or userId" });

  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };
  const max = Math.min(parseInt(limit) || 36, 50);
  const debugInfo = { steps: [] };

  try {
    // 1. Resolve username → user_id if not provided
    let userId = providedUserId;
    if (!userId && username) {
      const cleanUser = String(username).replace(/^@/, "").toLowerCase();
      const idRes = await fetch(`https://${HOST}/user_id_by_username?username=${encodeURIComponent(cleanUser)}`, { headers });
      const idText = await idRes.text();
      debugInfo.steps.push({ step: "user_id_by_username", status: idRes.status, preview: idText.substring(0, 200) });
      if (!idRes.ok) {
        return res.status(idRes.status).json({ error: `Could not resolve username (${idRes.status})`, debug: debugInfo });
      }
      const idData = JSON.parse(idText || "{}");
      userId = idData.UserID || idData.user_id || idData?.data?.user_id;
      if (!userId) return res.status(404).json({ error: "User not found", debug: debugInfo });

      // Pause between backend calls to respect Ultra's 1 req/sec rate limit
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    // 2. Fetch reels with cursor-based pagination. The /reels endpoint
    // returns at most 12 items per call. To get more, pass a max_id from
    // the previous response. We page up to 3 times (36 items max) for
    // the first /api call, which is enough to power Load more client-side
    // without hammering the Ultra tier.
    const MAX_PAGES = 3;
    let nextMaxId = req.body?.maxId || "";
    const allItems = [];
    let finalCursor = "";
    let moreAvailable = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ user_id: String(userId), include_feed_video: "true" });
      if (nextMaxId) params.set("max_id", nextMaxId);
      const url = `https://${HOST}/reels?${params.toString()}`;

      if (page > 0) await sleep(RATE_LIMIT_DELAY_MS);

      const r = await fetch(url, { headers });
      const t = await r.text();
      debugInfo.steps.push({
        step: `reels_page_${page}`, status: r.status, len: t.length,
        preview: t.substring(0, 300),
      });

      if (!r.ok) {
        // If it's the first page, bubble the error. Otherwise stop paging
        // and use what we've collected.
        if (page === 0) {
          let upstream = t; try { upstream = JSON.parse(t)?.error || t; } catch {}
          return res.status(r.status).json({ error: upstream, upstreamStatus: r.status, debug: debugInfo });
        }
        break;
      }

      let raw; try { raw = JSON.parse(t); } catch { break; }

      if (page === 0 && raw && typeof raw === "object" && !Array.isArray(raw)) {
        debugInfo.topKeys = Object.keys(raw).slice(0, 12);
      }

      // mediacrawlers shape: { status, data: { items: [...], paging_token | next_max_id } }
      const d = raw?.data || raw;
      const items = Array.isArray(d?.items) ? d.items
        : Array.isArray(raw?.items) ? raw.items
        : Array.isArray(raw) ? raw
        : [];

      // Find the cursor — IG / mediacrawlers uses a few different field names
      const cursor = d?.paging_token || d?.next_max_id || d?.max_id
        || raw?.paging_token || raw?.next_max_id || raw?.max_id || "";
      const hasMore = !!cursor && (d?.more_available !== false);

      allItems.push(...items);
      if (page === 0 && items.length > 0) {
        const first = items[0]?.node || items[0]?.media || items[0];
        debugInfo.firstItemKeys = first ? Object.keys(first).slice(0, 20) : null;
      }

      finalCursor = cursor;
      moreAvailable = hasMore;
      if (!hasMore || items.length === 0) break;
      nextMaxId = cursor;
      // Stop early if we already have as many as the caller wanted
      if (allItems.length >= max) break;
    }

    debugInfo.listLen = allItems.length;
    debugInfo.pages = debugInfo.steps.filter(s => s.step.startsWith("reels_page_")).length;
    debugInfo.finalCursor = finalCursor;
    debugInfo.moreAvailable = moreAvailable;

    if (allItems.length === 0) {
      return res.json({
        videos: [],
        stats: { total: 0, note: "No reels returned for this user." },
        ...(debug ? { debug: debugInfo } : {}),
      });
    }

    // 3. Normalize each item into our standard video shape
    const normalized = allItems.slice(0, max).map(item => normalizeReel(item)).filter(Boolean);

    // 4. Compute outlier score per video (views relative to creator's avg views)
    const viewsSum = normalized.reduce((s, v) => s + (v.views || 0), 0);
    const avgViews = normalized.length > 0 ? viewsSum / normalized.length : 0;
    const withOutlier = normalized.map(v => ({
      ...v,
      outlierScore: avgViews > 0 && v.views > 0 ? v.views / avgViews : 0,
    }));

    return res.json({
      videos: withOutlier,
      nextMaxId: finalCursor || null,
      hasMore: !!moreAvailable,
      stats: { total: withOutlier.length, avgViews: Math.round(avgViews) },
      ...(debug ? { debug: debugInfo } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch reels", debug: debugInfo });
  }
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function normalizeReel(item) {
  const m = item?.node || item?.media || item;
  if (!m) return null;

  const id = String(m.pk || m.id || m.code || m.shortcode || "");
  if (!id) return null;

  // View counts — try every common field name
  const views = m.play_count ?? m.view_count ?? m.ig_play_count
    ?? m.video_view_count ?? m.video_play_count ?? m.number_of_qualities ?? 0;
  const likes = m.like_count ?? m.likes ?? m.edge_liked_by?.count ?? m.edge_media_preview_like?.count ?? 0;
  const comments = m.comment_count ?? m.comments ?? m.edge_media_to_comment?.count ?? 0;

  const captionRaw = m.caption?.text || m.caption_text || m.caption
    || m.edge_media_to_caption?.edges?.[0]?.node?.text || "";
  const caption = typeof captionRaw === "string" ? captionRaw : "";
  const title = caption.slice(0, 120) || "Instagram Reel";

  const takenAt = m.taken_at || m.taken_at_timestamp || 0;
  const publishedAt = takenAt ? new Date(takenAt * 1000).toISOString() : null;

  const thumb = m.image_versions2?.candidates?.[0]?.url
    || m.thumbnail_url
    || m.display_uri
    || m.display_url
    || m.cover_frame_url
    || m.thumbnail_src
    || "";
  const thumbnail = thumb ? `/api/proxy-image?url=${encodeURIComponent(thumb)}` : "";

  const code = m.code || m.shortcode || "";
  const url = code ? `https://www.instagram.com/reel/${code}/` : "";

  // Raw video file URL (for download proxying). Instagram returns multiple
  // quality versions; pick the highest-resolution one available.
  const versions = m.video_versions || m.video_resources || [];
  let videoUrl = "";
  if (Array.isArray(versions) && versions.length > 0) {
    // Sort by width descending so we get the highest-res version
    const sorted = [...versions].sort((a, b) => (b.width || 0) - (a.width || 0));
    videoUrl = sorted[0]?.url || sorted[0]?.src || "";
  }
  if (!videoUrl) videoUrl = m.video_url || "";

  return {
    id,
    title,
    caption, // full caption text (title is truncated to 120 chars)
    views,
    viewsFormatted: formatNum(views),
    likes,
    comments,
    engagementRate: views > 0 ? (likes + comments) / views : 0,
    thumbnail,
    videoUrl,
    url,
    shortcode: code,
    platform: "Instagram Reels",
    publishedAt,
  };
}

function formatNum(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
