// Fetch a single Instagram account by handle, WITH the full bio.
//
// Uses `instagram-api-fast-reliable-data-scraper` on RapidAPI (by mediacrawlers).
// That product has dedicated /profile and /similar_accounts endpoints and is
// confirmed to return `biography`.
//
// Subscribe (Basic/Free tier works):
//   https://rapidapi.com/mediacrawlers-mediacrawlers-default/api/instagram-api-fast-reliable-data-scraper/pricing
//
// Falls back to the legacy search endpoint (no bio) if the new product isn't
// subscribed yet, so the app keeps working during the transition.

const NEW_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
const LEGACY_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { handle } = req.body;
  if (!handle || !handle.trim()) return res.status(400).json({ error: "Provide a handle" });

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const clean = handle.trim().replace(/^@/, "").toLowerCase();

  // Try the new API: username → user_id → profile
  const fromNew = await fetchProfileFromNewApi(clean, rapidApiKey);
  if (fromNew) {
    return res.json({ profile: fromNew, source: "mediacrawlers" });
  }

  // Fall back to the legacy search endpoint (no bio available)
  const fromLegacy = await fetchProfileFromLegacySearch(clean, rapidApiKey);
  if (fromLegacy) {
    return res.json({
      profile: fromLegacy,
      source: "legacy-search",
      warning: "Bio unavailable — subscribe to 'instagram-api-fast-reliable-data-scraper' on RapidAPI for bio + similar accounts.",
    });
  }

  return res.json({ profile: null });
}

async function fetchProfileFromNewApi(username, apiKey) {
  // Verified endpoints on the current plan:
  //   /user_id_by_username?username=X  → { UserID, UserName }
  //   /profile?user_id=X               → full profile with biography
  //   /profile?username=X              → also works, skips the id hop
  const headers = { "x-rapidapi-host": NEW_HOST, "x-rapidapi-key": apiKey };
  try {
    // Single call: /profile accepts username directly
    const pRes = await fetch(`https://${NEW_HOST}/profile?username=${encodeURIComponent(username)}`, { method: "GET", headers });
    if (!pRes.ok) return null;
    const u = await pRes.json().catch(() => null);
    if (!u || !u.username) return null;

    const followerCount = u.follower_count ?? u.followers_count ?? 0;
    const rawPic = u.profile_pic_url_hd || u.profile_pic_url || "";
    const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

    return {
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
