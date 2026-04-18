// Niche/keyword search for Instagram creators.
//
// Uses mediacrawlers (instagram-api-fast-reliable-data-scraper) on Ultra tier.
// Confirmed endpoint: GET /users_search?query=<q>
//
// This replaces the legacy `instagram-scraper-stable-api` (Stable API) that
// was the only thing our $28.99 paid subscription was being used for. Once
// this is live, that subscription can be cancelled.

const HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, page } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  }

  const pageNum = Math.max(0, parseInt(page) || 0);
  const headers = { "x-rapidapi-host": HOST, "x-rapidapi-key": rapidApiKey };

  try {
    // Build query variations per page tier. We keep the structure from the
    // legacy implementation (tiers A / B / C) so subsequent Load-more pages
    // return genuinely new accounts instead of re-fetching the same list.
    const q = query.trim();
    const words = q.split(/\s+/);

    const suffixesCore  = ["coach", "tips", "daily", "pro", "guru", "reels", "official"];
    const suffixesExtra = ["life", "motivation", "hq", "journey", "academy", "fit", "hub", "world"];
    const prefixesCore  = ["the", "real", "best", "top", "daily"];
    const prefixesExtra = ["mr", "ms", "your", "coach", "dr", "official"];
    const niches        = ["online", "1on1", "elite", "performance", "premium", "global"];

    const tier = { A: new Set([q]), B: new Set(), C: new Set() };

    if (words.length > 1) {
      const joined = words.join("");
      const lastTwo = words.slice(-2).join("");
      tier.A.add(joined); tier.A.add(lastTwo);
      for (const s of suffixesCore)  { tier.A.add(joined + s); tier.A.add(lastTwo + s); }
      for (const p of prefixesCore)  { tier.B.add(p + joined); tier.B.add(p + lastTwo); }
      for (const s of suffixesExtra) { tier.B.add(joined + s); tier.B.add(lastTwo + s); }
      for (const p of prefixesExtra) { tier.C.add(p + joined); tier.C.add(p + lastTwo); }
      for (const n of niches)        { tier.C.add(n + lastTwo); tier.C.add(lastTwo + n); }
    } else {
      tier.A.add(q);
      for (const s of suffixesCore)  tier.A.add(q + s);
      for (const p of prefixesCore)  tier.A.add(p + q);
      for (const s of suffixesExtra) tier.B.add(q + s);
      for (const p of prefixesExtra) tier.B.add(p + q);
      tier.B.add(q + "s"); tier.B.add(q + "er");
      for (const n of niches)        { tier.C.add(n + q); tier.C.add(q + n); }
      tier.C.add(q + "girl"); tier.C.add(q + "guy");
      tier.C.add(q + "life"); tier.C.add(q + "world");
    }

    const tierKey = pageNum === 0 ? "A" : pageNum === 1 ? "B" : "C";
    const searchTerms = Array.from(tier[tierKey]);

    // Ultra tier is 1 request/second. Fire requests SERIALLY with a small
    // delay between them so we don't trigger the rate limiter. We cap the
    // number of variations per page so a single search completes in a
    // reasonable time.
    const MAX_PER_PAGE = 8;
    const termsThisPage = searchTerms.slice(0, MAX_PER_PAGE);

    const allUsers = [];
    const seen = new Set();

    for (const term of termsThisPage) {
      const users = await searchUsers(term, headers);
      for (const u of users) {
        const username = (u.username || "").toLowerCase();
        if (!username || seen.has(username)) continue;
        seen.add(username);
        allUsers.push(u);
      }
      // 1.05s pause between requests to stay under 1 req/sec
      await sleep(1050);
    }

    if (allUsers.length === 0) {
      return res.json({ creators: [], page: pageNum, hasNextPage: pageNum < 2 });
    }

    // Normalise to our standard creator shape
    const creators = allUsers.map(normalize).filter(Boolean);

    // Sort by follower count desc (accounts with known counts first)
    creators.sort((a, b) => {
      const hasA = (a.subscriberCount || 0) > 0 ? 1 : 0;
      const hasB = (b.subscriberCount || 0) > 0 ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      return (b.subscriberCount || 0) - (a.subscriberCount || 0);
    });

    return res.json({ creators, page: pageNum, hasNextPage: pageNum < 2 });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Search failed" });
  }
}

async function searchUsers(queryTerm, headers) {
  try {
    const r = await fetch(
      `https://${HOST}/users_search?query=${encodeURIComponent(queryTerm)}`,
      { headers }
    );
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    // Response shape: { users: [...] } or array — handle both
    return Array.isArray(data) ? data : (data.users || data.data || data.results || []);
  } catch { return []; }
}

function normalize(u) {
  if (!u || !u.username) return null;
  const user = u.user || u;
  const followerCount = user.follower_count ?? user.followers_count ?? 0;
  const rawPic = user.profile_pic_url_hd || user.profile_pic_url || "";
  const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

  return {
    id: String(user.pk || user.id || user.user_id || user.username),
    name: user.full_name || user.username,
    username: user.username,
    description: user.biography || user.bio || "",
    category: user.category || user.category_name || "",
    thumbnail,
    platform: "Instagram Reels",
    subscribers: followerCount ? formatFollowers(followerCount) : "N/A",
    subscriberCount: followerCount,
    totalViews: "N/A",
    videoCount: user.media_count || 0,
    isVerified: !!(user.is_verified || user.verified),
  };
}

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return String(n) + " followers";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
