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
  const max = Math.min(parseInt(limit) || 24, 50);
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

    // 2. Fetch the reels. include_feed_video=true is REQUIRED by this API.
    const reelsUrl = `https://${HOST}/reels?user_id=${encodeURIComponent(userId)}&include_feed_video=true`;
    const reelsRes = await fetch(reelsUrl, { headers });
    const reelsText = await reelsRes.text();
    debugInfo.steps.push({ step: "reels", status: reelsRes.status, len: reelsText.length, preview: reelsText.substring(0, 400) });

    if (!reelsRes.ok) {
      let upstream = reelsText;
      try { upstream = JSON.parse(reelsText)?.error || reelsText; } catch {}
      return res.status(reelsRes.status).json({ error: upstream, upstreamStatus: reelsRes.status, debug: debugInfo });
    }

    let raw; try { raw = JSON.parse(reelsText); } catch {
      return res.status(502).json({ error: "Upstream returned non-JSON", debug: debugInfo });
    }

    // Record the top-level keys so we can see the response shape
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      debugInfo.topKeys = Object.keys(raw).slice(0, 12);
    }

    // The mediacrawlers /reels endpoint returns:
    //   { status: "ok", data: { items: [ { media: {...} }, ... ] } }
    // Check the nested path first, then fall back to other shapes we might
    // encounter with different upstream versions.
    const list = Array.isArray(raw) ? raw
      : raw?.data?.items
      || raw?.items
      || raw?.reels
      || raw?.media
      || raw?.results
      || raw?.user?.edge_owner_to_timeline_media?.edges
      || (Array.isArray(raw?.data) ? raw.data : null)
      || [];

    debugInfo.listLen = Array.isArray(list) ? list.length : 0;
    if (Array.isArray(list) && list.length > 0) {
      const first = list[0]?.node || list[0]?.media || list[0];
      debugInfo.firstItemKeys = first ? Object.keys(first).slice(0, 20) : null;
    }

    if (!Array.isArray(list) || list.length === 0) {
      return res.json({
        videos: [],
        stats: { total: 0, note: "No reels returned for this user." },
        ...(debug ? { debug: debugInfo } : {}),
      });
    }

    // 3. Normalize each item into our standard video shape
    const normalized = list.slice(0, max).map(item => normalizeReel(item)).filter(Boolean);

    // 4. Compute outlier score per video (views relative to creator's avg views)
    const viewsSum = normalized.reduce((s, v) => s + (v.views || 0), 0);
    const avgViews = normalized.length > 0 ? viewsSum / normalized.length : 0;
    const withOutlier = normalized.map(v => ({
      ...v,
      outlierScore: avgViews > 0 && v.views > 0 ? v.views / avgViews : 0,
    }));

    return res.json({
      videos: withOutlier,
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

  const caption = m.caption?.text || m.caption_text || m.caption
    || m.edge_media_to_caption?.edges?.[0]?.node?.text || "";
  const title = (typeof caption === "string" ? caption : "").slice(0, 120) || "Instagram Reel";

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
