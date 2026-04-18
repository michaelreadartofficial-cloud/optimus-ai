// Find Instagram accounts similar to a given handle.
//
// Strategy:
//   1. Fetch the seed's profile (returns `category` and `biography`)
//   2. Use the `category` field as the primary similarity signal —
//      Instagram categorises creators (e.g. "Personal trainer", "Athlete",
//      "Public figure", "Digital creator"). Two accounts with the same
//      category are genuinely doing the same kind of work.
//   3. Fall back to bio keyword search if category is missing or too
//      generic (e.g. "Digital creator" alone isn't specific enough).
//   4. For each candidate, fetch their profile to verify the category (or
//      bio) matches.
//
// The native similar_accounts endpoint is not available on the current
// subscription tier, so this is the best approximation we can build.

const NEW_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
const LEGACY_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const MAX_CANDIDATES_TO_ENRICH = 40;

// Categories that are too broad to be a useful similarity signal on their own.
// When the seed has one of these, we fall back to bio keywords.
const GENERIC_CATEGORIES = new Set([
  "digital creator", "creator", "public figure", "artist",
  "community", "product/service", "entrepreneur", "writer",
  "", null, undefined,
]);

const BIO_STOPWORDS = new Set([
  "i","im","me","my","we","us","you","your","the","a","an","and","or","but",
  "of","for","to","in","on","at","with","by","as","is","are","was","were","be",
  "been","have","has","had","get","got","will","can","from","this","that","these","those",
  "help","helping","how","if","so","do","does","just","all","more","not","no",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { handle } = req.body;
  if (!handle || !handle.trim()) return res.status(400).json({ error: "Provide a handle" });

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const clean = handle.trim().replace(/^@/, "").toLowerCase();
  const newHeaders = { "x-rapidapi-host": NEW_HOST, "x-rapidapi-key": rapidApiKey };
  const legacyHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-rapidapi-host": LEGACY_HOST,
    "x-rapidapi-key": rapidApiKey,
  };

  try {
    // 1. Seed profile
    const seed = await fetchProfile(clean, newHeaders);
    if (!seed) return res.json({ creators: [], warning: "Could not load seed profile." });

    const seedCategory = (seed.category || "").toLowerCase().trim();
    const seedBio = (seed.biography || "").toLowerCase();
    const useCategory = seedCategory && !GENERIC_CATEGORIES.has(seedCategory);

    // 2. Build search queries
    const queries = new Set();
    if (useCategory) {
      // Category is specific — search for it directly + split into words
      queries.add(seedCategory);
      for (const w of seedCategory.split(/\s+/)) if (w.length > 2) queries.add(w);
    }
    // Also add bio keywords as auxiliary queries (widens the candidate pool)
    const bioKeywords = extractKeywords(seedBio).slice(0, 8);
    for (const k of bioKeywords.slice(0, 6)) queries.add(k);
    // Pairs of bio keywords for tighter matches
    for (let i = 0; i < Math.min(bioKeywords.length, 3); i++) {
      for (let j = i + 1; j < Math.min(bioKeywords.length, 5); j++) {
        queries.add(`${bioKeywords[i]} ${bioKeywords[j]}`);
      }
    }

    if (queries.size === 0) {
      return res.json({
        creators: [],
        warning: `${clean} has no category or meaningful bio to search by.`,
      });
    }

    const queryList = Array.from(queries);

    // 3. Run searches in parallel (legacy endpoint is what's available for
    // niche searches — mediacrawlers search is paid)
    const searchResults = await Promise.all(
      queryList.map(q => legacySearch(q, legacyHeaders).catch(() => []))
    );

    const seen = new Set([clean]);
    const candidates = [];
    for (const list of searchResults) {
      for (const user of list) {
        const uname = (user.username || "").toLowerCase();
        if (!uname || seen.has(uname)) continue;
        seen.add(uname);
        candidates.push(user);
        if (candidates.length >= MAX_CANDIDATES_TO_ENRICH) break;
      }
      if (candidates.length >= MAX_CANDIDATES_TO_ENRICH) break;
    }

    if (candidates.length === 0) {
      return res.json({ creators: [], warning: "No candidate accounts found.", seedCategory, bioKeywords });
    }

    // 4. Enrich each candidate via /profile so we can compare category + bio
    const seedKeywordSet = new Set(bioKeywords);
    const enriched = await Promise.all(
      candidates.map(c => enrichAndScore(c, newHeaders, seedCategory, seedKeywordSet, useCategory))
    );

    const filtered = enriched
      .filter(e => e && e._score > 0)
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        const hasA = (a.subscriberCount || 0) > 0 ? 1 : 0;
        const hasB = (b.subscriberCount || 0) > 0 ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      });

    return res.json({
      creators: filtered.map(cleanForClient),
      source: useCategory ? "category+bio" : "bio-only",
      seedCategory: seed.category || "",
      bioKeywords,
      stats: {
        candidatesEnriched: candidates.length,
        matched: filtered.length,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function fetchProfile(username, headers) {
  try {
    const r = await fetch(`https://${NEW_HOST}/profile?username=${encodeURIComponent(username)}`, { headers });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch { return null; }
}

async function legacySearch(query, headers) {
  try {
    const r = await fetch(`https://${LEGACY_HOST}/search_ig.php`, {
      method: "POST", headers,
      body: `search_query=${encodeURIComponent(query)}`,
    });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    return (data.users || []).map(it => it.user || it);
  } catch { return []; }
}

async function enrichAndScore(candidate, headers, seedCategory, seedKeywordSet, useCategory) {
  if (!candidate.username) return null;
  const profile = await fetchProfile(candidate.username, headers);
  if (!profile) return null;

  const candidateCategory = (profile.category || "").toLowerCase().trim();
  const candidateBio = (profile.biography || "").toLowerCase();

  let score = 0;
  // Category match is the strongest signal
  if (useCategory && candidateCategory) {
    if (candidateCategory === seedCategory) {
      score += 100;
    } else if (seedCategory.includes(candidateCategory) || candidateCategory.includes(seedCategory)) {
      score += 50;  // partial e.g. "fitness trainer" vs "personal trainer"
    } else {
      // Share any meaningful word with the seed category
      const sharedWords = seedCategory.split(/\s+/).filter(w => w.length > 3 && candidateCategory.includes(w));
      if (sharedWords.length > 0) score += 30;
    }
  }
  // Bio keyword overlap as secondary signal
  if (candidateBio && seedKeywordSet.size > 0) {
    let overlap = 0;
    for (const k of seedKeywordSet) if (candidateBio.includes(k)) overlap++;
    score += overlap * 10;
  }
  // Drop obvious non-matches
  if (useCategory && score === 0) return null;
  if (!useCategory && score < 20) return null;  // need at least 2 bio keyword hits

  const followerCount = profile.follower_count || 0;
  const rawPic = profile.profile_pic_url_hd || profile.profile_pic_url || "";
  const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

  return {
    id: String(profile.pk || ""),
    name: profile.full_name || profile.username,
    username: profile.username,
    description: profile.biography || "",
    category: profile.category || "",
    thumbnail,
    platform: "Instagram Reels",
    subscribers: followerCount ? formatFollowers(followerCount) : "N/A",
    subscriberCount: followerCount,
    isVerified: !!profile.is_verified,
    _score: score,
  };
}

function cleanForClient(c) { const { _score, ...rest } = c; return rest; }

function extractKeywords(text) {
  const cleaned = (text || "").toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ");
  const words = cleaned.split(" ").filter(w => w.length > 2 && !BIO_STOPWORDS.has(w));
  const seen = new Set(); const out = [];
  for (const w of words) if (!seen.has(w)) { seen.add(w); out.push(w); }
  return out;
}

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n.toString() + " followers";
}
