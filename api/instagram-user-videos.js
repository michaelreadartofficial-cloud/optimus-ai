// Fetch an Instagram creator's reels via mediacrawlers'
// instagram-api-fast-reliable-data-scraper product.
//
// Confirmed working path: /reels?user_id=X
// Returns normalized video objects with computed outlier scores.
//
// Input: { username?, userId? } — pass userId if you already have it
//        (saves a lookup), otherwise pass username and we'll resolve it.

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { username, userId: providedUserId, limit } = req.body || {};

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  if (!username && !providedUserId) return res.status(400).json({ error: "Provide username or userId" });

  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };
  const max = Math.min(parseInt(limit) || 24, 50);

  try {
    // 1. Resolve username → user_id if not provided
    let userId = providedUserId;
    if (!userId && username) {
      const cleanUser = String(username).replace(/^@/, "").toLowerCase();
      const idRes = await fetch(`https://${HOST}/user_id_by_username?username=${encodeURIComponent(cleanUser)}`, { headers });
      if (!idRes.ok) return res.status(idRes.status).json({ error: `Could not resolve username (${idRes.status})` });
      const idData = await idRes.json().catch(() => ({}));
      userId = idData.UserID || idData.user_id || idData?.data?.user_id;
      if (!userId) return res.status(404).json({ error: "User not found" });
    }

    // 2. Fetch the reels
    const reelsRes = await fetch(`https://${HOST}/reels?user_id=${encodeURIComponent(userId)}`, { headers });
    const reelsText = await reelsRes.text();

    if (!reelsRes.ok) {
      // Try to parse the error so the caller gets a meaningful message
      let upstream = reelsText;
      try { upstream = JSON.parse(reelsText)?.error || reelsText; } catch {}
      return res.status(reelsRes.status).json({ error: upstream, upstreamStatus: reelsRes.status });
    }

    let raw; try { raw = JSON.parse(reelsText); } catch {
      return res.status(502).json({ error: "Upstream returned non-JSON" });
    }

    // The API may wrap the list under different keys; handle all common shapes
    const list = Array.isArray(raw) ? raw
      : raw?.items || raw?.data || raw?.reels || raw?.media || raw?.results || [];

    if (!Array.isArray(list) || list.length === 0) {
      return res.json({ videos: [], stats: { total: 0, note: "No reels returned for this user." } });
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
      stats: {
        total: withOutlier.length,
        avgViews: Math.round(avgViews),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch reels" });
  }
}

function normalizeReel(item) {
  // Peel common wrapper shapes
  const m = item?.media || item;
  if (!m) return null;

  const id = String(m.pk || m.id || m.code || "");
  if (!id) return null;

  // View counts — try every common field name
  const views = m.play_count ?? m.view_count ?? m.ig_play_count
    ?? m.video_view_count ?? m.video_play_count ?? 0;
  const likes = m.like_count ?? m.likes ?? 0;
  const comments = m.comment_count ?? m.comments ?? 0;

  // Caption text
  const caption = m.caption?.text || m.caption_text || m.caption || "";
  const title = (typeof caption === "string" ? caption : "").slice(0, 120) || "Instagram Reel";

  // Published timestamp (unix seconds → ms)
  const takenAt = m.taken_at || m.taken_at_timestamp || 0;
  const publishedAt = takenAt ? new Date(takenAt * 1000).toISOString() : null;

  // Thumbnail: try the many nested paths Instagram uses
  const thumb = m.image_versions2?.candidates?.[0]?.url
    || m.thumbnail_url
    || m.display_uri
    || m.cover_frame_url
    || m.video_url
    || "";
  const thumbnail = thumb ? `/api/proxy-image?url=${encodeURIComponent(thumb)}` : "";

  // Permalink
  const code = m.code || m.shortcode || "";
  const url = code ? `https://www.instagram.com/reel/${code}/` : "";

  return {
    id,
    title,
    views,
    viewsFormatted: formatNum(views),
    likes,
    comments,
    engagementRate: views > 0 ? (likes + comments) / views : 0,
    thumbnail,
    url,
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
