// Get Instagram accounts similar to a given handle.
//
// Uses the `instagram-scraper-20251` API's built-in similar-accounts endpoint
// — this returns accounts Instagram itself considers related (the same list
// you'd see under "Suggested for you" on the profile). Far better than any
// keyword-based approximation.
//
// Returns `null` if the new API isn't subscribed, so the frontend can fall
// back to its own logic.

const NEW_HOST = "instagram-scraper-20251.p.rapidapi.com";

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

  // The new API exposes similar accounts under a few possible paths depending
  // on plan tier; try them in order.
  const attempts = [
    `/similar_accounts/?username_or_id_or_url=${encodeURIComponent(clean)}`,
    `/similar_accounts?username=${encodeURIComponent(clean)}`,
    `/user/related_profiles?username=${encodeURIComponent(clean)}`,
    `/related_profiles/?username_or_id_or_url=${encodeURIComponent(clean)}`,
  ];

  for (const path of attempts) {
    try {
      const r = await fetch(`https://${NEW_HOST}${path}`, {
        method: "GET",
        headers: { "x-rapidapi-host": NEW_HOST, "x-rapidapi-key": apiKey(rapidApiKey) },
      });
      if (!r.ok) continue;
      const data = await r.json().catch(() => null);
      const list = extractList(data);
      if (!list || !list.length) continue;

      const creators = list.map(normalize).filter(Boolean);
      if (creators.length > 0) {
        return res.json({ creators, source: "instagram-scraper-20251", endpoint: path });
      }
    } catch {}
  }

  return res.json({ creators: [], warning: "Similar-accounts endpoint not available on current RapidAPI plan." });
}

function apiKey(k) { return k; } // indirection for clarity

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data || data.users || data.similar_users || data.related_profiles || data.results || [];
}

function normalize(u) {
  if (!u) return null;
  const user = u.user || u;
  const username = user.username;
  if (!username) return null;
  const followerCount = user.follower_count ?? user.followers_count ?? 0;
  const rawPic = user.profile_pic_url_hd || user.profile_pic_url || "";
  return {
    id: user.pk || user.id || user.user_id || username,
    name: user.full_name || username,
    username,
    description: user.biography || user.bio || "",
    category: user.category || user.category_name || "",
    thumbnail: rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "",
    platform: "Instagram Reels",
    subscribers: followerCount ? formatFollowers(followerCount) : "N/A",
    subscriberCount: followerCount,
    isVerified: !!(user.is_verified || user.verified),
  };
}

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n.toString() + " followers";
}
