// Probe mediacrawlers Search endpoint paths to find the right one for
// niche search. Only returns data once user has Ultra or Mega tier.
//
// Usage: /api/debug-mediacrawlers-search?q=fitness

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.json({ error: "No RAPIDAPI_KEY set" });
  const q = (req.query.q || "fitness").toLowerCase();
  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };

  const paths = [
    // Common Search endpoint paths on similar RapidAPI products
    `/search?query=${encodeURIComponent(q)}`,
    `/search?q=${encodeURIComponent(q)}`,
    `/search/users?query=${encodeURIComponent(q)}`,
    `/search/users?q=${encodeURIComponent(q)}`,
    `/search/user?query=${encodeURIComponent(q)}`,
    `/search_users?query=${encodeURIComponent(q)}`,
    `/user_search?query=${encodeURIComponent(q)}`,
    `/users/search?query=${encodeURIComponent(q)}`,
    `/users?query=${encodeURIComponent(q)}`,
    `/search/accounts?query=${encodeURIComponent(q)}`,
    `/accounts/search?query=${encodeURIComponent(q)}`,
    `/ig_search?query=${encodeURIComponent(q)}`,
    `/search?search_query=${encodeURIComponent(q)}`,
  ];

  const results = [];
  for (const p of paths) {
    try {
      const r = await fetch(`https://${HOST}${p}`, { headers });
      const t = await r.text();
      let parsed, listLen = 0, topKeys = null, sampleKeys = null, firstUsername = null;
      try {
        parsed = JSON.parse(t);
        const list = Array.isArray(parsed) ? parsed
          : parsed?.users || parsed?.data || parsed?.results || parsed?.items || [];
        if (Array.isArray(list)) {
          listLen = list.length;
          if (listLen > 0) {
            const first = list[0]?.user || list[0];
            sampleKeys = Object.keys(first || {}).slice(0, 20);
            firstUsername = first?.username || null;
          }
        }
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          topKeys = Object.keys(parsed).slice(0, 12);
        }
      } catch {}
      results.push({ path: p, status: r.status, listLen, topKeys, sampleKeys, firstUsername, preview: t.substring(0, 180) });
    } catch (e) {
      results.push({ path: p, error: e.message });
    }
  }

  return res.json({ query: q, results });
}
