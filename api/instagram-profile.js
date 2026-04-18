// Fetch a single Instagram account by handle, WITH the full bio.
//
// Uses `instagram-scraper-20251` on RapidAPI, which returns full profile
// data (biography, category, external_url, follower_count) — unlike the
// old `instagram-scraper-stable-api` which only returns lightweight search
// results without bios.
//
// Requires: your RapidAPI key must be subscribed to the
// `instagram-scraper-20251` product (Basic tier is free, 500 calls/mo).
// Signup: https://rapidapi.com/DataFanatic/api/instagram-scraper-20251
//
// Falls back to the legacy search endpoint if the profile call fails, so
// the app keeps working (just without a bio) when the new product isn't
// subscribed yet.

const NEW_HOST = "instagram-scraper-20251.p.rapidapi.com";
const LEGACY_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

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

  // 1. Try the new API's profile endpoint (returns biography + category)
  const fromNew = await fetchProfileFromNewApi(clean, rapidApiKey);
  if (fromNew) {
    return res.json({ profile: fromNew, source: "instagram-scraper-20251" });
  }

  // 2. Fall back to the legacy search endpoint (no bio available)
  const fromLegacy = await fetchProfileFromLegacySearch(clean, rapidApiKey);
  if (fromLegacy) {
    return res.json({
      profile: fromLegacy,
      source: "legacy-search",
      warning: "Bio unavailable — subscribe to instagram-scraper-20251 on RapidAPI for bio + similar-accounts support.",
    });
  }

  return res.json({ profile: null });
}

async function fetchProfileFromNewApi(username, apiKey) {
  try {
    const url = `https://${NEW_HOST}/userinfo/?username_or_id_or_url=${encodeURIComponent(username)}`;
    const r = await fetch(url, {
      method: "GET",
      headers: { "x-rapidapi-host": NEW_HOST, "x-rapidapi-key": apiKey },
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    const u = data?.data || data?.user || data;
    if (!u || !u.username) return null;

    const followerCount = u.follower_count ?? u.followers_count ?? u.edge_followed_by?.count ?? 0;
    const rawPic = u.profile_pic_url_hd || u.profile_pic_url || u.hd_profile_pic_url_info?.url || "";
    const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

    return {
      id: u.pk || u.id || u.user_id || "",
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
    };
  } catch { return null; }
}

async function fetchProfileFromLegacySearch(username, apiKey) {
  try {
    const r = await fetch(`https://${LEGACY_HOST}/search_ig.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": LEGACY_HOST,
        "x-rapidapi-key": apiKey,
      },
      body: `search_query=${encodeURIComponent(username)}`,
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    const users = (data.users || []).map(it => it.user || it);
    const match =
      users.find(u => (u.username || "").toLowerCase() === username) ||
      users.find(u => (u.username || "").toLowerCase().startsWith(username)) ||
      users[0];
    if (!match) return null;
    const followersText = match.search_social_context || "";
    const followerCount = parseFollowers(followersText);
    const rawPic = match.profile_pic_url || "";
    const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";
    return {
      id: match.pk || match.id || "",
      name: match.full_name || match.username || "",
      username: match.username || "",
      description: match.biography || "",
      category: "",
      externalUrl: "",
      thumbnail,
      platform: "Instagram Reels",
      subscribers: followersText || "N/A",
      subscriberCount: followerCount,
      isVerified: !!match.is_verified,
    };
  } catch { return null; }
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

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n.toString() + " followers";
}
