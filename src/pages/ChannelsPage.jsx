import { useState, useRef } from "react";
import { Search, ChevronDown, Plus, X, Loader2, RefreshCw } from "lucide-react";
import { PlatformIcon } from "../components/PlatformIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { apiPost } from "../utils/api";
import { formatNumber, parseFollowers } from "../utils/format";

export const ChannelsPage = ({ watchlist, setWatchlist }) => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [handleSearch, setHandleSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("instagram");
  const [accountSizeFilter, setAccountSizeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [backendHasMore, setBackendHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSizeDrop, setShowSizeDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cancellation token for background follower-count enrichment. Incremented
  // every time a new search fires so any in-flight enrichment from the
  // previous search stops writing stale data into state.
  const enrichRunId = useRef(0);

  // Profile-enrichment cache: username → { subscriberCount, subscribers,
  // description, category }. Persists across searches so we don't re-burn
  // API quota fetching the same creator twice.
  const PROFILE_CACHE_KEY = "optimus_profile_cache";
  const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const loadProfileCache = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch { return {}; }
  };
  const saveProfileToCache = (username, profile) => {
    try {
      const cache = loadProfileCache();
      cache[username] = { ...profile, cachedAt: Date.now() };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  };

  // Top up each creator with follower count + bio + category by hitting
  // /api/instagram-profile one at a time (Ultra = 1 req/sec, so we space
  // calls 1.1s apart). Updates state per-creator so cards populate
  // progressively instead of waiting for the whole batch. Caches results
  // for 24h so repeat searches are instant.
  const enrichFollowers = async (creators) => {
    const runId = ++enrichRunId.current;
    const ENRICH_DELAY_MS = 1100;
    const MAX_TO_ENRICH = 25;
    const cache = loadProfileCache();
    const now = Date.now();

    // First pass: apply any cached data synchronously so cached creators
    // show follower counts immediately without an API call.
    const cacheUpdates = [];
    for (const c of creators) {
      const hit = c.username && cache[c.username];
      if (hit && (now - (hit.cachedAt || 0)) < PROFILE_CACHE_TTL_MS) {
        cacheUpdates.push({ id: c.id, data: hit });
      }
    }
    if (cacheUpdates.length > 0) {
      setSuggestions(prev => prev.map(s => {
        const hit = cacheUpdates.find(u => u.id === s.id);
        return hit ? { ...s, ...hit.data } : s;
      }));
    }

    // Second pass: fetch missing ones from the network
    const needsEnrichment = creators
      .filter(c => c.username && !c.subscriberCount && (c.platform || "").toLowerCase().includes("instagram"))
      .filter(c => !cache[c.username] || (now - (cache[c.username].cachedAt || 0)) >= PROFILE_CACHE_TTL_MS);

    const targets = needsEnrichment.slice(0, MAX_TO_ENRICH);
    // Mark creators past the cap as "skipped" so the UI shows "—" for them
    // instead of an indefinite "loading…" state they'll never transition out
    // of.
    const skipped = needsEnrichment.slice(MAX_TO_ENRICH);
    if (skipped.length > 0) {
      const skippedIds = new Set(skipped.map(s => s.id));
      setSuggestions(prev => prev.map(s => skippedIds.has(s.id) ? { ...s, _enrichSkipped: true } : s));
    }
    // Mark the ones we ARE going to enrich so we can distinguish "loading now"
    // from "nothing will happen"
    if (targets.length > 0) {
      const targetIds = new Set(targets.map(t => t.id));
      setSuggestions(prev => prev.map(s => targetIds.has(s.id) ? { ...s, _enriching: true } : s));
    }

    for (const c of targets) {
      if (enrichRunId.current !== runId) return; // new search started — abort
      try {
        const r = await apiPost("/api/instagram-profile", { handle: c.username });
        if (enrichRunId.current !== runId) return;
        const p = r.profile;
        if (!p) continue;
        const data = {
          subscriberCount: p.subscriberCount || 0,
          subscribers: p.subscribers || "",
          description: p.description || "",
          category: p.category || "",
        };
        setSuggestions(prev => prev.map(s => s.id === c.id ? { ...s, ...data, _enriching: false } : s));
        saveProfileToCache(c.username, data);
      } catch {
        // Silently skip failures (rate limits, 404s) — keeps N/A
      }
      await new Promise(r => setTimeout(r, ENRICH_DELAY_MS));
    }
  };

  const platformRank = (p) => {
    const s = (p || "").toLowerCase();
    if (s.includes("instagram")) return 0;
    if (s.includes("youtube")) return 1;
    if (s.includes("tiktok")) return 2;
    return 3;
  };

  // Decide whether a creator is topically relevant to the query. This is a
  // HARD filter — accounts that fail it are dropped entirely, so a search for
  // "online fitness coach" never surfaces something like "@toponlineshop1"
  // just because one partial word matched.
  // Many creators signal their profession in the bio without the exact
  // query word ("I help" = coaching, "mentor" ≈ coach). These synonym
  // groups let bio matching know that e.g. "I help women over 30 lose
  // body fat" counts as evidence for a "fitness coach" search.
  // Role synonyms — what a "coach" / "mentor" / "trainer" look like in a bio.
  // All of these aliases point to the same combined group so searching
  // "business coach" and "business mentor" both match "I help entrepreneurs..."
  const COACH_GROUP = [
    "coach", "coaching", "mentor", "mentoring", "trainer", "training",
    "consultant", "consulting", "strategist", "advisor", "expert",
    "i help", "helping", "i work with", "i teach", "teaching",
    "transform", "guide", "guiding", "specialist",
  ];
  const ROLE_SYNONYMS = {
    coach: COACH_GROUP, mentor: COACH_GROUP, trainer: COACH_GROUP,
    consultant: COACH_GROUP, strategist: COACH_GROUP, advisor: COACH_GROUP,
    therapist: ["therapist", "therapy", "counsellor", "counselor", "psychologist"],
    nutritionist: ["nutritionist", "dietitian", "nutrition coach", "macro coach"],
  };

  // Topic synonyms — overlap health/fitness/nutrition/wellness because a
  // real fitness coach's bio usually covers all of it. Same for business
  // coach / entrepreneur / marketing — it's all one niche in practice.
  const FITNESS_GROUP = [
    "fitness", "workout", "workouts", "training", "gym", "muscle", "muscles",
    "lean", "body fat", "bodyfat", "get toned", "toned", "get in shape",
    "in shape", "strength", "strong", "athlete", "athletic", "crossfit",
    "calisthenics", "hypertrophy", "performance", "biohacking",
    "nutrition", "macros", "diet", "meal prep", "mealprep", "food", "eating",
    "weight loss", "fat loss", "lose weight", "lose fat", "transformation",
    "health", "wellness", "hormones", "sleep", "recovery", "testosterone",
    "energy", "mobility",
  ];
  const BUSINESS_GROUP = [
    "business", "entrepreneur", "entrepreneurs", "entrepreneurship",
    "startup", "startups", "founder", "founders", "ceo", "owner",
    "scale", "scaling", "grow your business", "grow", "7 figure", "8 figure",
    "marketing", "sales", "strategy", "revenue", "profit", "clients",
    "e-commerce", "ecommerce", "online business", "agency", "saas",
    "freelance", "freelancer", "digital", "brand", "branding",
  ];
  const RELATIONSHIP_GROUP = [
    "relationship", "relationships", "dating", "love", "couples", "marriage",
    "partner", "boyfriend", "girlfriend", "husband", "wife",
    "attachment", "intimacy", "breakup", "communication",
  ];
  const MINDSET_GROUP = [
    "mindset", "confidence", "self help", "self-help", "personal growth",
    "mental", "mental health", "anxiety", "stress", "therapy",
    "meditation", "manifestation", "purpose", "habits",
  ];
  const TOPIC_SYNONYMS = {
    fitness: FITNESS_GROUP, health: FITNESS_GROUP, nutrition: FITNESS_GROUP,
    wellness: FITNESS_GROUP, workout: FITNESS_GROUP, gym: FITNESS_GROUP,
    biohacking: FITNESS_GROUP,
    business: BUSINESS_GROUP, entrepreneur: BUSINESS_GROUP, marketing: BUSINESS_GROUP,
    relationship: RELATIONSHIP_GROUP, dating: RELATIONSHIP_GROUP, love: RELATIONSHIP_GROUP,
    mindset: MINDSET_GROUP, confidence: MINDSET_GROUP,
  };
  const expand = (word, dict) => dict[word] ? dict[word] : [word];

  const queryRelevant = (creator, rawQuery) => {
    const q = (rawQuery || "").trim().toLowerCase();
    if (!q) return true;
    const handle = (creator.username || "").toLowerCase();
    const name = (creator.name || "").toLowerCase();
    const desc = (creator.description || "").toLowerCase();
    const handleNoSep = handle.replace(/[._\-]/g, "");
    const nameNoSpace = name.replace(/\s+/g, "");
    const handleAndName = `${handle} ${name}`;
    const words = q.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      if (handle.includes(words[0]) || name.includes(words[0])) return true;
      // Also accept strong bio signal for single-word niches (e.g. searching
      // "fitness" — a bio heavy with gym/workout/muscle terms counts).
      const synonyms = expand(words[0], TOPIC_SYNONYMS);
      const hits = synonyms.filter(s => desc.includes(s)).length;
      return hits >= 2;
    }

    // --- Multi-word query ---
    const joined = words.join("");

    // Strong match 1: full phrase in handle or name (the "Mike Read | Online
    // Fitness Coach" case — handle or name explicitly contains the phrase)
    if (handleNoSep.includes(joined)) return true;
    if (nameNoSpace.includes(joined)) return true;
    if (handleAndName.includes(words.join(" "))) return true;

    // Strong match 2: role-word in handle/name AND topic evidence anywhere
    // Example query: "online fitness coach" → roleWord = "coach",
    // topicWord = "fitness". Accept accounts where the handle/name
    // contains "coach" and the bio talks about fitness/workout/muscle/etc.
    const roleWord = words[words.length - 1];
    const topicWord = words.length >= 2 ? words[words.length - 2] : null;

    const roleSynonyms = expand(roleWord, ROLE_SYNONYMS);
    const topicSynonyms = topicWord ? expand(topicWord, TOPIC_SYNONYMS) : [];

    const roleInHandleOrName = roleSynonyms.some(r => handleAndName.includes(r));
    const roleInBio = roleSynonyms.some(r => desc.includes(r));
    const topicInHandleOrName = topicWord && topicSynonyms.some(t => handleAndName.includes(t));
    const topicHitsInBio = topicSynonyms.filter(t => desc.includes(t)).length;
    const topicStrongInBio = topicHitsInBio >= 2;
    // Bonus: bios with phrases like "i help" often describe the niche
    // without saying "coach" directly
    const intentInBio = /\bi (help|coach|work with|mentor|train)\b/.test(desc);

    // Accept if:
    //   a) role term is explicit in handle/name AND topic shows up anywhere
    if (roleInHandleOrName && (topicInHandleOrName || topicHitsInBio >= 1)) return true;
    //   b) role term is in bio (synonym ok) AND topic is clearly the subject
    if ((roleInBio || intentInBio) && (topicInHandleOrName || topicStrongInBio)) return true;
    //   c) the handle/name explicitly contains the topic word AND the bio
    //      shows clear role intent ("I help", "i coach", etc.)
    if (topicInHandleOrName && intentInBio) return true;

    return false;
  };

  // Score a creator by how well they match the query. Higher = more relevant.
  // Combines exact-phrase hits, per-word hits, and synonym-expanded bio hits
  // so an account whose handle is a name but bio clearly describes the niche
  // still ranks high.
  const relevanceScore = (creator, rawQuery) => {
    const q = (rawQuery || "").trim().toLowerCase();
    if (!q) return 0;
    const name = (creator.name || "").toLowerCase();
    const handle = (creator.username || "").toLowerCase();
    const desc = (creator.description || "").toLowerCase();
    const handleAndName = `${handle} ${name}`;
    const words = q.split(/\s+/).filter(Boolean);
    let score = 0;

    // Exact phrase matches
    if (handle.includes(q)) score += 120;
    if (name.includes(q)) score += 100;
    if (desc.includes(q)) score += 30;

    // Per-word matches in handle / name
    for (const w of words) {
      if (handle.includes(w)) score += 18;
      if (name.includes(w)) score += 14;
      if (desc.includes(w)) score += 6;
    }

    // All query words present in handle/name — strong signal
    if (words.length > 1) {
      if (words.every(w => handle.includes(w))) score += 60;
      if (words.every(w => name.includes(w))) score += 45;
      if (words.every(w => handleAndName.includes(w))) score += 25;
    }

    // Role word (typically last word: coach/mentor/trainer) — big bonus when
    // it (or a synonym) appears in handle/name
    const roleWord = words[words.length - 1];
    const roleSynonyms = expand(roleWord, ROLE_SYNONYMS);
    if (roleSynonyms.some(r => handleAndName.includes(r))) score += 40;
    if (roleSynonyms.some(r => desc.includes(r))) score += 15;

    // Topic synonyms in the bio — this is the big one. Rewards accounts
    // whose bio proves they're in the niche, even if their handle doesn't
    // say so. Score scales with how many synonym hits we get.
    for (const w of words) {
      const topicWords = expand(w, TOPIC_SYNONYMS);
      if (topicWords.length > 1) {
        const bioHits = topicWords.filter(t => desc.includes(t)).length;
        score += Math.min(bioHits, 8) * 6; // cap at 8 hits so one bio can't run away
        const nameHits = topicWords.filter(t => handleAndName.includes(t)).length;
        score += Math.min(nameHits, 3) * 10;
      }
    }

    // Intent phrases ("I help", "I coach", "I work with") — clear signal
    // the bio describes a coaching service
    if (/\bi (help|coach|work with|mentor|train|teach|guide)\b/.test(desc)) score += 20;

    // Penalise profiles that have NO bio at all and no word match in
    // handle/name — they're probably unrelated
    if (!desc && !words.some(w => handleAndName.includes(w))) score -= 40;

    return score;
  };

  // Pull the most useful keywords out of an account bio for "similar
  // accounts" search. Strips emoji and stopwords, keeps niche nouns.
  const BIO_STOPWORDS = new Set([
    "i", "im", "i'm", "me", "my", "we", "us", "you", "your", "the", "a", "an",
    "and", "or", "but", "of", "for", "to", "in", "on", "at", "with", "by",
    "as", "is", "are", "was", "were", "be", "been", "have", "has", "had",
    "get", "got", "will", "can", "from", "this", "that", "these", "those",
    "help", "helping", "coaching", "coach", "mentor", "mentoring",
  ]);
  const extractBioKeywords = (bio) => {
    if (!bio) return [];
    const cleaned = bio
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s.&+]/gu, " ")
      .replace(/\s+/g, " ");
    const words = cleaned.split(" ").filter(w => w.length > 2 && !BIO_STOPWORDS.has(w));
    const seen = new Set();
    const keywords = [];
    for (const w of words) {
      if (!seen.has(w)) { seen.add(w); keywords.push(w); }
      if (keywords.length >= 6) break;
    }
    return keywords;
  };

  const fetchSingleInstagramByHandle = async (handle) => {
    try {
      const r = await apiPost("/api/instagram-profile", { handle });
      return r.profile || null;
    } catch { return null; }
  };

  // Run a single page of query against the enabled platforms.
  const fetchPage = async (query, page) => {
    const requests = [];
    if (platformFilter === "all" || platformFilter === "youtube") {
      requests.push(apiPost("/api/search-creators", { query, platform: "youtube" }).then(r => r.creators || []).catch(() => []));
    }
    if (platformFilter === "all" || platformFilter === "instagram") {
      requests.push(apiPost("/api/search-creators-instagram", { query, page }).then(r => ({ creators: r.creators || [], hasNextPage: !!r.hasNextPage })).catch(() => ({ creators: [], hasNextPage: false })));
    }
    if (platformFilter === "all" || platformFilter === "tiktok") {
      requests.push(apiPost("/api/search-creators-tiktok", { query }).then(r => r.creators || []).catch(() => []));
    }
    const results = await Promise.all(requests);
    // Normalize: the Instagram branch returns {creators, hasNextPage}, the
    // others return creators array directly.
    let creators = [];
    let hasNextPage = false;
    for (const r of results) {
      if (Array.isArray(r)) creators.push(...r);
      else { creators.push(...(r.creators || [])); if (r.hasNextPage) hasNextPage = true; }
    }
    return { creators, hasNextPage };
  };

  const doSearch = async () => {
    const rawQuery = (searchQuery || handleSearch || "").trim();
    if (!rawQuery) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(0);
    setLastQuery(rawQuery);

    // Seed-by-handle mode: just show the requested account. No similar-
    // accounts lookup — the API tier we have doesn't expose a reliable
    // similar-accounts endpoint, and bio/category-based approximations
    // weren't producing results the user wanted.
    const isHandleInput = !!handleSearch.trim() || /^@[\w._-]+$/.test(rawQuery);
    if (isHandleInput && platformFilter !== "youtube" && platformFilter !== "tiktok") {
      const handleClean = rawQuery.replace(/^@/, "").trim();
      const seed = await fetchSingleInstagramByHandle(handleClean);
      if (seed) {
        setLastQuery(handleClean);
        setSuggestions([seed]);
        setVisibleCount(50);
        setBackendHasMore(false);
        setLoading(false);
        return;
      }
      // Seed not found — fall through to normal search
    }

    const query = rawQuery;
    try {
      // Fetch the first page, then if the active account-size filter
      // restricts the pool to fewer than TARGET_INITIAL_FILTERED accounts,
      // keep fetching additional backend pages until we hit the target or
      // the backend runs out.
      const TARGET_INITIAL_FILTERED = 50;
      const watchIds = new Set(watchlist.map(w => w.id));
      const seenIds = new Set();

      let allCreators = [];
      let page = 0;
      let stillHasMore = true;
      let filteredCount = 0;
      let firstPageResult = null;

      while (stillHasMore && filteredCount < TARGET_INITIAL_FILTERED) {
        const res = await fetchPage(query, page);
        if (page === 0) firstPageResult = res;
        stillHasMore = res.hasNextPage;
        for (const c of res.creators) {
          if (!c.id || seenIds.has(c.id) || watchIds.has(c.id)) continue;
          seenIds.add(c.id);
          allCreators.push(c);
          if (filterBySize(c)) filteredCount++;
        }
        page += 1;
      }
      const hasNextPage = stillHasMore;
      // Deduping against watchlist already happened inside the fetch loop.

      // No hard filter — score every creator. Highly relevant accounts float
      // to the top; marginal ones sink but aren't hidden. User can Load more
      // to dig deeper.

      // Sort order:
      //   1) Accounts with known follower counts above accounts without
      //   2) Relevance score (higher = more on-topic)
      //   3) Platform priority (Instagram → YouTube → TikTok)
      //   4) Follower count as final tiebreaker
      allCreators.sort((a, b) => {
        const hasFollowersA = (a.subscriberCount || 0) > 0 ? 1 : 0;
        const hasFollowersB = (b.subscriberCount || 0) > 0 ? 1 : 0;
        if (hasFollowersA !== hasFollowersB) return hasFollowersB - hasFollowersA;
        const scoreDiff = relevanceScore(b, query) - relevanceScore(a, query);
        if (scoreDiff !== 0) return scoreDiff;
        const rankDiff = platformRank(a.platform) - platformRank(b.platform);
        if (rankDiff !== 0) return rankDiff;
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      });

      setSuggestions(allCreators);
      setVisibleCount(50);
      setBackendHasMore(hasNextPage);
      // Track the last page we've already fetched so Load more picks up
      // from the next one (page was incremented after each fetch, so the
      // last successfully fetched page is page - 1).
      setCurrentPage(Math.max(0, page - 1));
      // Kick off background enrichment — follower counts flow in over time
      // instead of blocking the initial render
      enrichFollowers(allCreators);
    } catch (err) {
      setError(err.message || "Failed to search creators");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the next page(s) from the backend and APPEND.
  // When a restrictive filter (e.g. Large 1M+) is active, a single backend
  // page might add very few new matching accounts. Keep fetching pages
  // until we add enough filtered matches to justify the user's click, OR
  // the backend runs out of pages.
  const TARGET_NEW_FILTERED_MATCHES = 10;
  const LOAD_MORE_INCREMENT = 10;

  const loadMoreFromBackend = async () => {
    if (loadingMore || !backendHasMore || !lastQuery) return;
    setLoadingMore(true);
    try {
      const watchIds = new Set(watchlist.map(w => w.id));
      const seenIds = new Set(suggestions.map(s => s.id));
      const currentFilteredLen = suggestions.filter(filterBySize).length;

      let page = currentPage;
      let stillHasMore = backendHasMore;
      let accumulated = [];
      let addedFilteredCount = 0;

      // Keep fetching pages until we've added enough filtered matches or run out
      while (stillHasMore && addedFilteredCount < TARGET_NEW_FILTERED_MATCHES) {
        page += 1;
        const { creators, hasNextPage } = await fetchPage(lastQuery, page);
        stillHasMore = hasNextPage;
        const fresh = creators.filter(c => !seenIds.has(c.id) && !watchIds.has(c.id));
        for (const c of fresh) {
          seenIds.add(c.id);
          accumulated.push(c);
          if (filterBySize(c)) addedFilteredCount++;
        }
      }

      accumulated.sort((a, b) => {
        const hasFollowersA = (a.subscriberCount || 0) > 0 ? 1 : 0;
        const hasFollowersB = (b.subscriberCount || 0) > 0 ? 1 : 0;
        if (hasFollowersA !== hasFollowersB) return hasFollowersB - hasFollowersA;
        return relevanceScore(b, lastQuery) - relevanceScore(a, lastQuery);
      });

      setSuggestions(prev => [...prev, ...accumulated]);
      // Reveal LOAD_MORE_INCREMENT additional filtered accounts. Since
      // visibleCount counts against the unfiltered list, bump it enough that
      // the filtered slice grows by the target amount.
      setVisibleCount(prev => prev + LOAD_MORE_INCREMENT + accumulated.length);
      setCurrentPage(page);
      setBackendHasMore(stillHasMore);
      // Background enrich the newly-loaded accounts
      enrichFollowers(accumulated);
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") doSearch(); };

  const filterBySize = (creator) => {
    if (accountSizeFilter === "all") return true;
    const num = creator.subscriberCount || parseFollowers(creator.subscribers);
    if (accountSizeFilter === "large") return num >= 1000000;
    if (accountSizeFilter === "medium") return num >= 100000 && num < 1000000;
    if (accountSizeFilter === "small") return num < 100000;
    return true;
  };

  // Live-filtered suggestions list. Applied at render time so changing the
  // Account-size dropdown after a search instantly updates what's shown —
  // no need to re-search.
  const filteredSuggestions = suggestions.filter(filterBySize);

  const filterLocal = (creator) => {
    if (platformFilter !== "all") {
      const p = creator.platform?.toLowerCase() || "";
      if (platformFilter === "youtube" && !p.includes("youtube")) return false;
      if (platformFilter === "instagram" && !p.includes("instagram")) return false;
      if (platformFilter === "tiktok" && !p.includes("tiktok")) return false;
    }
    if (!filterBySize(creator)) return false;
    const q = (handleSearch || "").trim().toLowerCase();
    if (q && !(creator.username || creator.name || "").toLowerCase().includes(q)) return false;
    return true;
  };

  const filteredWatchlist = watchlist.filter(filterLocal);

  const addToWatchlist = (creator) => {
    setWatchlist(prev => [...prev, creator]);
    setSuggestions(prev => prev.filter(s => s.id !== creator.id));
  };

  const removeFromWatchlist = (creatorId) => {
    setWatchlist(prev => prev.filter(w => w.id !== creatorId));
  };

  const platformLabel = { all: "All platforms", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
  const sizeLabel = { all: "Account size", large: "Large (1M+)", medium: "Medium (100K-1M)", small: "Small (<100K)" };

  const creatorProfileUrl = (creator) => {
    const handle = creator.username || "";
    const p = (creator.platform || "").toLowerCase();
    if (!handle) return null;
    if (p.includes("instagram")) return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
    if (p.includes("tiktok"))    return `https://www.tiktok.com/@${handle.replace(/^@/, "")}`;
    if (p.includes("youtube")) {
      // YouTube handles are typically @-prefixed; fall back to channel page if we have an id
      if (creator.id && creator.id.startsWith("UC")) return `https://www.youtube.com/channel/${creator.id}`;
      return `https://www.youtube.com/@${handle.replace(/^@/, "")}`;
    }
    return null;
  };

  const findSimilar = (creator) => {
    // Prefer the creator's handle so doSearch enters seed-mode and builds
    // a bio-driven similar search. Fall back to a name-based text search.
    if (creator.username) {
      setHandleSearch(creator.username);
      setSearchQuery("");
    } else {
      const seed = (creator.name || "").replace(/[._\-]/g, " ").trim();
      if (!seed) return;
      setSearchQuery(seed);
      setHandleSearch("");
    }
    setTimeout(() => doSearch(), 0);
  };

  const CreatorCard = ({ creator, action, showSimilar = false }) => {
    const url = creatorProfileUrl(creator);
    const openProfile = () => { if (url) window.open(url, "_blank", "noopener,noreferrer"); };
    return (
      <div onClick={openProfile}
        className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-300 transition-all group ${url ? "cursor-pointer" : ""}`}
        title={url ? `Open ${creator.username || creator.name} on ${creator.platform}` : undefined}>
        <div className="relative flex-shrink-0">
          <img src={creator.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || creator.username)}&background=random&color=fff`}
            alt={creator.name} className="w-10 h-10 rounded-full object-cover"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || creator.username || "?")}&background=random&color=fff`; }} />
          <div className="absolute -bottom-1 -right-1">
            <PlatformIcon platform={creator.platform} size={18} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{creator.name || creator.username}</p>
          <p className="text-xs text-gray-500">
            @{creator.username || creator.name} ·{" "}
            {creator.subscriberCount > 0
              ? `${formatNumber(creator.subscriberCount)} followers`
              : creator._enriching
                ? <span className="text-gray-400 italic">loading…</span>
                : <span className="text-gray-400">—</span>}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 flex-shrink-0">
          {showSimilar && (
            <button onClick={() => findSimilar(creator)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Show me more profiles like this">
              <RefreshCw size={14} />
            </button>
          )}
          {action}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Creators</h2>
        <p className="text-sm text-gray-500 mt-1">Pick which creators to include in your videos feed</p>
      </div>

      <div className="flex gap-2 mb-5">
        {["suggestions", "watchlist"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab === "suggestions" ? "Suggestions" : `Watchlist (${watchlist.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2.5 md:gap-3 md:items-center md:flex-wrap">
          <input type="text" placeholder="e.g. Online Fitness Coach"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="md:flex-1 md:min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          <input type="text" placeholder="Search by handle"
            value={handleSearch} onChange={(e) => setHandleSearch(e.target.value)} onKeyDown={handleKeyDown}
            className="md:w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />

          <div className="grid grid-cols-2 md:grid-cols-none md:flex gap-2">
            <div className="relative">
              <button onClick={() => { setShowPlatformDrop(!showPlatformDrop); setShowSizeDrop(false); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
                <span className="truncate">{platformLabel[platformFilter]}</span> <ChevronDown size={14} className="flex-shrink-0" />
              </button>
              {showPlatformDrop && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowPlatformDrop(false)} />
                  <div className="absolute top-full left-0 right-0 md:right-auto mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 md:w-40">
                    {Object.entries(platformLabel).map(([val, label]) => (
                      <button key={val} onClick={() => { setPlatformFilter(val); setShowPlatformDrop(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${platformFilter === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setShowSizeDrop(!showSizeDrop); setShowPlatformDrop(false); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
                <span className="truncate">{sizeLabel[accountSizeFilter]}</span> <ChevronDown size={14} className="flex-shrink-0" />
              </button>
              {showSizeDrop && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowSizeDrop(false)} />
                  <div className="absolute top-full left-0 right-0 md:right-auto mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 md:w-48">
                    {Object.entries(sizeLabel).map(([val, label]) => (
                      <button key={val} onClick={() => { setAccountSizeFilter(val); setShowSizeDrop(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${accountSizeFilter === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <button onClick={doSearch} disabled={loading}
            className="w-full md:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
      </div>

      {activeTab === "suggestions" ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {loading && <LoadingSpinner text="Searching creators across platforms..." />}
            {error && <ErrorMessage message={error} onRetry={doSearch} />}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSuggestions.slice(0, visibleCount).map(creator => (
                    <CreatorCard key={creator.id} creator={creator} showSimilar action={
                      <button onClick={() => addToWatchlist(creator)}
                        className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        title="Add to Watchlist">
                        <Plus size={14} />
                      </button>
                    } />
                  ))}
                </div>
                {(filteredSuggestions.length > visibleCount || backendHasMore) && (
                  <div className="mt-5 flex justify-center">
                    <button
                      disabled={loadingMore}
                      onClick={() => {
                        if (filteredSuggestions.length > visibleCount) {
                          setVisibleCount(c => c + 25);
                        } else {
                          loadMoreFromBackend();
                        }
                      }}
                      className="px-5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2">
                      {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : "Load more"}
                    </button>
                  </div>
                )}
                {filteredSuggestions.length > 0 && filteredSuggestions.length <= visibleCount && !backendHasMore && hasSearched && (
                  <div className="mt-5 text-center text-xs text-gray-400">
                    Showing all {filteredSuggestions.length} results — try a different search term for more.
                  </div>
                )}
                {hasSearched && suggestions.length > 0 && filteredSuggestions.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No creators match the {sizeLabel[accountSizeFilter]} filter. Try a different size.
                  </div>
                )}
                {hasSearched && suggestions.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">No creators found. Try a different search term.</div>
                )}
                {!hasSearched && suggestions.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Search size={22} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Search for creators</p>
                    <p className="text-gray-400 text-xs">Enter a niche or handle above to discover creators across YouTube, Instagram, and TikTok</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden md:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Your Watchlist</h3>
                <span className="text-xs text-gray-400">{watchlist.length} / 100</span>
              </div>
              <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
                {watchlist.map(creator => (
                  <div key={creator.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="relative flex-shrink-0">
                      <img src={creator.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || "?")}&background=random&color=fff`}
                        alt={creator.name} className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || "?")}&background=random&color=fff`; }} />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <PlatformIcon platform={creator.platform} size={14} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{creator.username || creator.name}</p>
                      <p className="text-xs text-gray-400">{creator.subscriberCount > 0 ? formatNumber(creator.subscriberCount) : "—"}</p>
                    </div>
                    <button onClick={() => removeFromWatchlist(creator.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {watchlist.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Add creators to start building your feed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Your Watchlist</h3>
            <span className="text-xs text-gray-400">{watchlist.length} / 100 channels</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWatchlist.map(creator => (
              <CreatorCard key={creator.id} creator={creator} action={
                <button onClick={() => removeFromWatchlist(creator.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <X size={14} />
                </button>
              } />
            ))}
          </div>
          {filteredWatchlist.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No channels in your watchlist.</div>
          )}
        </div>
      )}
    </div>
  );
};
