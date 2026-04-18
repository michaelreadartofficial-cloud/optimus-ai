// Get Instagram accounts similar to a given handle.
//
// The mediacrawlers product DOES NOT expose /similar_accounts on the
// Basic/Free tier (confirmed via probe — all similar-account path names
// return 404). So we do the next best thing:
//
//   1. Fetch the seed's full profile (bio included) via /profile
//   2. Extract keywords from the seed's bio
//   3. Run several parallel searches against the legacy search endpoint
//      using those keywords
//   4. For each candidate we find, fetch their bio via the new API's
//      /profile endpoint and only keep candidates whose bio actually
//      overlaps with the seed's bio
//
// This is slower than a native similar-accounts call (makes N profile
// lookups) but produces genuinely similar accounts since every candidate
// is verified against the seed's bio.

const NEW_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";
const LEGACY_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const MAX_CANDIDATES_TO_ENRICH = 40;   // how many search results we'll bother fetching bios for
const MIN_KEYWORD_OVERLAP = 2;         // candidate's bio must share ≥N keywords with seed's bio

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
    // 1. Fetch seed profile to get the bio
    const seed = await fetchProfile(clean, newHeaders);
    if (!seed) return res.json({ creators: [], warning: "Could not load seed profile." });

    const seedBio = (seed.biography || "").toLowerCase();
    if (!seedBio) {
      return res.json({ creators: [], warning: `${clean} has no bio — we can't determine what kind of creator they are without one.` });
    }

    // 2. Extract keywords from the seed's bio
    const keywords = extractKeywords(seedBio).slice(0, 10);
    if (keywords.length < 2) {
      return res.json({ creators: [], warning: "Seed bio has too few meaningful keywords to search by." });
    }

    // 3. Search (legacy endpoint — it's the only one on current plan that
    //    can do niche searches) using each keyword + a few keyword pairs
    const queries = new Set();
    for (const k of keywords.slice(0, 6)) queries.add(k);
    for (let i = 0; i < Math.min(keywords.length, 3); i++) {
      for (let j = i + 1; j < Math.min(keywords.length, 5); j++) {
        queries.add(`${keywords[i]} ${keywords[j]}`);
      }
    }

    const queryList = Array.from(queries);
    const searchResults = await Promise.all(
      queryList.map(q => legacySearch(q, legacyHeaders).catch(() => []))
    );

    // 4. Dedupe candidates by username
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
      return res.json({ creators: [], warning: "No candidate accounts found for the seed's bio keywords." });
    }

    // 5. Enrich each candidate with a profile call (bio), then filter by
    //    keyword overlap against the seed's bio
    const seedKeywordSet = new Set(keywords);
    const enriched = await Promise.all(
      candidates.map(c => enrichAndScore(c, newHeaders, seedKeywordSet))
    );

    const filtered = enriched
      .filter(e => e && e._overlap >= MIN_KEYWORD_OVERLAP)
      .sort((a, b) => {
        if (b._overlap !== a._overlap) return b._overlap - a._overlap;
        const hasA = (a.subscriberCount || 0) > 0 ? 1 : 0;
        const hasB = (b.subscriberCount || 0) > 0 ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      });

    return res.json({
      creators: filtered.map(cleanForClient),
      source: "bio-overlap",
      seedKeywords: keywords,
      stats: {
        candidatesEnriched: candidates.length,
        matchedAfterBioFilter: filtered.length,
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

async function fetchProfileById(userId, headers) {
  try {
    const r = await fetch(`https://${NEW_HOST}/profile?user_id=${encodeURIComponent(userId)}`, { headers });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch { return null; }
}

async function legacySearch(query, headers) {
  try {
    const r = await fetch(`https://${LEGACY_HOST}/search_ig.php`, {
      method: "POST",
      headers,
      body: `search_query=${encodeURIComponent(query)}`,
    });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    return (data.users || []).map(it => it.user || it);
  } catch { return []; }
}

async function enrichAndScore(candidate, headers, seedKeywordSet) {
  const username = candidate.username;
  if (!username) return null;

  // Get the candidate's real profile (for the bio)
  const profile = await fetchProfile(username, headers);
  if (!profile || !profile.biography) {
    // Candidate has no bio — we can't verify they're similar. Drop.
    return null;
  }

  const bio = (profile.biography || "").toLowerCase();
  let overlap = 0;
  for (const k of seedKeywordSet) if (bio.includes(k)) overlap++;
  if (overlap === 0) return null;

  const followerCount = profile.follower_count || 0;
  const rawPic = profile.profile_pic_url_hd || profile.profile_pic_url || candidate.profile_pic_url || "";
  const thumbnail = rawPic ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}` : "";

  return {
    id: String(profile.pk || ""),
    name: profile.full_name || profile.username,
    username: profile.username,
    description: profile.biography,
    category: profile.category || "",
    thumbnail,
    platform: "Instagram Reels",
    subscribers: followerCount ? formatFollowers(followerCount) : "N/A",
    subscriberCount: followerCount,
    isVerified: !!profile.is_verified,
    _overlap: overlap,
  };
}

function cleanForClient(c) {
  const { _overlap, ...rest } = c;
  return rest;
}

function extractKeywords(text) {
  // Strip emoji, punctuation, numbers → split into words, drop stopwords
  const cleaned = (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ");
  const words = cleaned.split(" ").filter(w => w.length > 2 && !BIO_STOPWORDS.has(w));
  const seen = new Set();
  const out = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n.toString() + " followers";
}
