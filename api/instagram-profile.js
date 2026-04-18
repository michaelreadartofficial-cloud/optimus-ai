// Fetch a single Instagram account by exact handle.
// Uses the search endpoint (which is what we have access to on this RapidAPI
// plan) and returns the first result whose username matches case-insensitively.
// If no exact match, returns the closest prefix match so users at least
// see something useful.

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

  try {
    const searchRes = await fetch(
      "https://instagram-scraper-stable-api.p.rapidapi.com/search_ig.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
        body: `search_query=${encodeURIComponent(clean)}`,
      }
    );

    if (!searchRes.ok) {
      return res.status(502).json({ error: "Upstream search failed" });
    }

    const data = await searchRes.json().catch(() => ({}));
    const users = (data.users || []).map(it => it.user || it);

    // Prefer an exact match
    let match = users.find(u => (u.username || "").toLowerCase() === clean);
    // Fall back to the first username that starts with the requested handle
    if (!match) match = users.find(u => (u.username || "").toLowerCase().startsWith(clean));
    // Last resort: first result
    if (!match && users.length > 0) match = users[0];

    if (!match) {
      return res.json({ profile: null });
    }

    const followersText = match.search_social_context || "";
    const followerCount = parseFollowers(followersText);
    const rawPic = match.profile_pic_url || "";
    const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

    return res.json({
      profile: {
        id: match.pk || match.id || "",
        name: match.full_name || match.username || "",
        username: match.username || "",
        description: match.biography || "",
        thumbnail,
        platform: "Instagram Reels",
        subscribers: followersText || "N/A",
        subscriberCount: followerCount,
        isVerified: match.is_verified || false,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Profile lookup failed" });
  }
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
