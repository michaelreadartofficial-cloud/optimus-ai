// Discover the correct endpoint path for fetching a user's media/reels
// on the instagram-api-fast-reliable-data-scraper product.
//
// Usage: /api/debug-mediacrawlers-media?handle=cesare_shapable

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.json({ error: "No RAPIDAPI_KEY set" });
  const handle = (req.query.handle || "cesare_shapable").replace(/^@/, "").toLowerCase();
  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };

  // Resolve user_id first (we confirmed /user_id_by_username works)
  const idRes = await fetch(`https://${HOST}/user_id_by_username?username=${encodeURIComponent(handle)}`, { headers });
  const idText = await idRes.text();
  let idData; try { idData = JSON.parse(idText); } catch {}
  const userId = idData?.UserID || idData?.user_id || idData?.data?.user_id;

  if (!userId) {
    return res.json({ handle, error: "Could not resolve user_id", idResPreview: idText.substring(0, 300) });
  }

  const paths = [
    // Media / reels style paths
    `/user_media?user_id=${userId}`,
    `/user/media?user_id=${userId}`,
    `/user_feed?user_id=${userId}`,
    `/user/feed?user_id=${userId}`,
    `/user_reels?user_id=${userId}`,
    `/user/reels?user_id=${userId}`,
    `/user_posts?user_id=${userId}`,
    `/user/posts?user_id=${userId}`,
    `/posts?user_id=${userId}`,
    `/media?user_id=${userId}`,
    `/reels?user_id=${userId}`,
    `/feed?user_id=${userId}`,
    `/user_clips?user_id=${userId}`,
    `/clips?user_id=${userId}`,
    // some APIs use username
    `/user_media?username=${encodeURIComponent(handle)}`,
    `/user_reels?username=${encodeURIComponent(handle)}`,
    `/user_posts?username=${encodeURIComponent(handle)}`,
    `/reels?username=${encodeURIComponent(handle)}`,
  ];

  const results = [];
  for (const p of paths) {
    try {
      const r = await fetch(`https://${HOST}${p}`, { headers });
      const t = await r.text();
      let parsed, listLen = 0, sampleKeys = null, topKeys = null;
      try {
        parsed = JSON.parse(t);
        const list = Array.isArray(parsed) ? parsed
          : parsed?.data || parsed?.items || parsed?.posts || parsed?.media
          || parsed?.reels || parsed?.feed || parsed?.results || [];
        if (Array.isArray(list)) {
          listLen = list.length;
          if (listLen > 0) sampleKeys = Object.keys(list[0]).slice(0, 20);
        }
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          topKeys = Object.keys(parsed).slice(0, 12);
        }
      } catch {}
      results.push({ path: p, status: r.status, listLen, topKeys, sampleKeys, preview: t.substring(0, 180) });
    } catch (e) {
      results.push({ path: p, error: e.message });
    }
  }

  return res.json({ handle, userId, results });
}
