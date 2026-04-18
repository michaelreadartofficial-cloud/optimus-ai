// Fetch a single Instagram account by exact handle, WITH the full bio.
//
// The `search_ig.php` endpoint returns lightweight data (handle, name, pic,
// follower-count text) but its `biography` field is usually empty. To get
// the real bio we have to hit a dedicated profile endpoint.
//
// Different RapidAPI plans expose different endpoint names, so we try several
// in order and return as soon as one gives us a non-empty bio.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { handle } = req.body;
  if (!handle || !handle.trim()) {
    return res.status(400).json({ error: "Provide a handle" });
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  }

  const clean = handle.trim().replace(/^@/, "").toLowerCase();
  const host = "instagram-scraper-stable-api.p.rapidapi.com";
  const baseHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-rapidapi-host": host,
    "x-rapidapi-key": rapidApiKey,
  };

  // Step 1: find the account via the search endpoint (always works, gives pk)
  let match = null;
  try {
    const searchRes = await fetch(`https://${host}/search_ig.php`, {
      method: "POST", headers: baseHeaders,
      body: `search_query=${encodeURIComponent(clean)}`,
    });
    if (searchRes.ok) {
      const data = await searchRes.json().catch(() => ({}));
      const users = (data.users || []).map(it => it.user || it);
      match = users.find(u => (u.username || "").toLowerCase() === clean)
           || users.find(u => (u.username || "").toLowerCase().startsWith(clean))
           || users[0] || null;
    }
  } catch {}

  if (!match) return res.json({ profile: null });

  const pk = match.pk || match.id || "";

  // Step 2: enrich with a full-profile call if we don't already have a bio.
  // Try several common endpoints on this API; bail out as soon as one returns
  // a biography. Each attempt is tolerant of failure.
  let bio = match.biography || "";
  if (!bio) {
    const attempts = [
      { path: "/profile.php",      body: `username_or_id=${encodeURIComponent(clean)}` },
      { path: "/ig_profile.php",   body: `username=${encodeURIComponent(clean)}` },
      { path: "/user_info.php",    body: `user_id=${encodeURIComponent(pk)}` },
      { path: "/user_by_username.php", body: `username=${encodeURIComponent(clean)}` },
      { path: "/get_ig_profile.php", body: `username=${encodeURIComponent(clean)}` },
    ];
    for (const a of attempts) {
      try {
        const r = await fetch(`https://${host}${a.path}`, {
          method: "POST", headers: baseHeaders, body: a.body,
        });
        if (!r.ok) continue;
        const text = await r.text();
        // Try to find a biography field in whatever shape the response takes
        let parsed; try { parsed = JSON.parse(text); } catch { continue; }
        const candidate =
          parsed?.biography ||
          parsed?.bio ||
          parsed?.user?.biography ||
          parsed?.data?.biography ||
          parsed?.data?.user?.biography ||
          parsed?.graphql?.user?.biography ||
          "";
        if (candidate && typeof candidate === "string") { bio = candidate; break; }
      } catch {}
    }
  }

  const followersText = match.search_social_context || "";
  const followerCount = parseFollowers(followersText);
  const rawPic = match.profile_pic_url || "";
  const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

  return res.json({
    profile: {
      id: pk,
      name: match.full_name || match.username || "",
      username: match.username || "",
      description: bio,
      thumbnail,
      platform: "Instagram Reels",
      subscribers: followersText || "N/A",
      subscriberCount: followerCount,
      isVerified: match.is_verified || false,
    },
    debug: { bioSource: bio ? (match.biography ? "search" : "profile-enrichment") : "none" },
  });
}

function parseFollowers(text) {
  if (!text) return 0;
  const match = text.match(/([\d,.]+)\s*(M|K)?\s*followers/i);
  if (!match) return 0;
  let num = parseFloat(match[1].replace(/,/g, ""));
  if (match[2] && match[2].toUpperCase() === "M") num *= 1000000;
  if (match[2] && match[2].toUpperCase() === "K") num *= 1000;
  return Math.round(num);
}
