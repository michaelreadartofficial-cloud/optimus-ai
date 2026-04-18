// Fetch a single Instagram account by handle, WITH the full bio.
//
// Uses `instagram-api-fast-reliable-data-scraper` on RapidAPI (by mediacrawlers).
// That product has dedicated /profile and /similar_accounts endpoints and is
// confirmed to return `biography`. Requires Basic tier or higher.

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { handle } = req.body;
  if (!handle || !handle.trim()) return res.status(400).json({ error: "Provide a handle" });

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const clean = handle.trim().replace(/^@/, "").toLowerCase();
  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };

  try {
    // Single call — /profile accepts username directly
    const r = await fetch(`https://${HOST}/profile?username=${encodeURIComponent(clean)}`, { headers });
    if (!r.ok) {
      if (r.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded — please wait a second and retry." });
      }
      return res.status(r.status).json({ error: `Profile lookup failed (${r.status})` });
    }
    const u = await r.json().catch(() => null);
    if (!u || !u.username) return res.json({ profile: null });

    const followerCount = u.follower_count ?? u.followers_count ?? 0;
    const rawPic = u.profile_pic_url_hd || u.profile_pic_url || "";
    const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

    return res.json({
      profile: {
        id: String(u.pk || u.id || ""),
        name: u.full_name || u.username,
        username: u.username,
        description: u.biography || u.bio || "",
        category: u.category || u.category_name || "",
        externalUrl: u.external_url || "",
        thumbnail,
        platform: "Instagram Reels",
        subscribers: followerCount ? formatFollowers(followerCount) : "N/A",
        subscriberCount: followerCount,
        isVerified: !!(u.is_verified || u.verified),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Profile lookup failed" });
  }
}

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n.toString() + " followers";
}
