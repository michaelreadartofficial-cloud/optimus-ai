// Probe multiple RapidAPI Instagram endpoint names to find which ones work
// on this plan. Call with ?handle=cesare_shapable in the URL to test.

export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.json({ error: "No RAPIDAPI_KEY set" });

  const handle = (req.query.handle || "cesare_shapable").replace(/^@/, "").toLowerCase();
  const host = "instagram-scraper-stable-api.p.rapidapi.com";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-rapidapi-host": host,
    "x-rapidapi-key": rapidApiKey,
  };

  const attempts = [
    { path: "/search_ig.php", body: `search_query=${encodeURIComponent(handle)}` },
    { path: "/profile.php", body: `username_or_id=${encodeURIComponent(handle)}` },
    { path: "/profile.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/ig_profile.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/user_info.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/user_by_username.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/get_ig_profile.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/userinfo.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/user.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/get_user.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/profile_info.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/get_profile.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/ig_user.php", body: `username=${encodeURIComponent(handle)}` },
    { path: "/user_data.php", body: `username=${encodeURIComponent(handle)}` },
  ];

  const results = [];
  for (const a of attempts) {
    try {
      const r = await fetch(`https://${host}${a.path}`, { method: "POST", headers, body: a.body });
      const text = await r.text();
      let parsed; let biography = null;
      try {
        parsed = JSON.parse(text);
        biography =
          parsed?.biography ||
          parsed?.bio ||
          parsed?.user?.biography ||
          parsed?.data?.biography ||
          parsed?.data?.user?.biography ||
          parsed?.graphql?.user?.biography ||
          null;
      } catch {}
      results.push({
        endpoint: a.path,
        body: a.body,
        status: r.status,
        contentLength: text.length,
        preview: text.substring(0, 200),
        hasBio: !!biography,
        bio: biography ? biography.substring(0, 200) : null,
        topLevelKeys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 10) : null,
      });
    } catch (e) {
      results.push({ endpoint: a.path, body: a.body, error: e.message });
    }
  }

  return res.json({ handle, results });
}
