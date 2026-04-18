// Get Instagram accounts similar to a given handle — using Instagram's own
// "Similar Account Recommendations" signal via the
// `instagram-api-fast-reliable-data-scraper` RapidAPI product.
//
// Flow: username → user_id → similar_accounts
// Each returned account gets enriched with a profile call to get bios, but
// only for the top N so we don't burn the whole API quota on one search.

const NEW_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
const ENRICH_BIOS_FOR_TOP = 12; // bios for the first 12, others get lightweight card

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { handle } = req.body;
  if (!handle || !handle.trim()) return res.status(400).json({ error: "Provide a handle" });

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const clean = handle.trim().replace(/^@/, "").toLowerCase();
  const headers = { "x-rapidapi-host": NEW_HOST, "x-rapidapi-key": rapidApiKey };

  try {
    // 1. username → user_id
    const idRes = await fetch(`https://${NEW_HOST}/username_to_id?username=${encodeURIComponent(clean)}`, { headers });
    if (!idRes.ok) {
      return res.json({
        creators: [],
        warning: "Similar accounts unavailable — subscribe to 'instagram-api-fast-reliable-data-scraper' on RapidAPI.",
      });
    }
    const idData = await idRes.json().catch(() => null);
    const userId = idData?.user_id || idData?.data?.user_id || idData?.id || idData?.data?.id;
    if (!userId) return res.json({ creators: [], warning: "User not found." });

    // 2. Similar accounts. The endpoint path can be one of a few shapes
    // depending on plan; try the common ones.
    const similarPaths = [
      `/similar_accounts?user_id=${encodeURIComponent(userId)}`,
      `/similar_account_recommendations?user_id=${encodeURIComponent(userId)}`,
      `/user/similar_accounts?user_id=${encodeURIComponent(userId)}`,
    ];

    let similarRaw = [];
    for (const p of similarPaths) {
      try {
        const r = await fetch(`https://${NEW_HOST}${p}`, { headers });
        if (!r.ok) continue;
        const data = await r.json().catch(() => null);
        similarRaw = extractList(data);
        if (similarRaw.length > 0) break;
      } catch {}
    }

    if (!similarRaw.length) {
      return res.json({ creators: [], warning: "No similar accounts returned for this user." });
    }

    // Normalise each similar account into our creator shape
    const creators = similarRaw.map(normalize).filter(Boolean);

    // Enrich the top N with bios (separate profile calls)
    const toEnrich = creators.slice(0, ENRICH_BIOS_FOR_TOP);
    const enrichPromises = toEnrich.map(async (c) => {
      if (c.description) return c;
      try {
        const r = await fetch(`https://${NEW_HOST}/profile?user_id=${encodeURIComponent(c.id)}`, { headers });
        if (!r.ok) return c;
        const d = await r.json().catch(() => null);
        const u = d?.data || d?.user || d;
        if (!u) return c;
        return {
          ...c,
          description: u.biography || u.bio || c.description || "",
          category: u.category || u.category_name || c.category || "",
          subscriberCount: u.follower_count ?? u.followers_count ?? c.subscriberCount ?? 0,
          subscribers: (u.follower_count || u.followers_count)
            ? formatFollowers(u.follower_count || u.followers_count)
            : c.subscribers,
        };
      } catch { return c; }
    });
    const enriched = await Promise.all(enrichPromises);
    const final = [...enriched, ...creators.slice(ENRICH_BIOS_FOR_TOP)];

    return res.json({ creators: final, source: "mediacrawlers-similar" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data || data.users || data.similar_users || data.accounts || data.results || [];
}

function normalize(u) {
  if (!u) return null;
  const user = u.user || u;
  const username = user.username;
  if (!username) return null;
  const followerCount = user.follower_count ?? user.followers_count ?? 0;
  const rawPic = user.profile_pic_url_hd || user.profile_pic_url || "";
  return {
    id: String(user.pk || user.id || user.user_id || username),
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
