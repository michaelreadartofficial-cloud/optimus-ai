import { useState } from "react";
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
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSizeDrop, setShowSizeDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  // Score a creator by how well name/username/description match the query.
  // Higher score = more relevant. Follower count is only a tiebreaker later.
  const relevanceScore = (creator, rawQuery) => {
    const q = (rawQuery || "").trim().toLowerCase();
    if (!q) return 0;
    const name = (creator.name || "").toLowerCase();
    const handle = (creator.username || "").toLowerCase();
    const desc = (creator.description || "").toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    let score = 0;
    // Exact phrase matches
    if (handle.includes(q)) score += 100;
    if (name.includes(q)) score += 90;
    if (desc.includes(q)) score += 20;
    // Per-word matches
    for (const w of words) {
      if (handle.includes(w)) score += 15;
      if (name.includes(w)) score += 12;
      if (desc.includes(w)) score += 4;
    }
    // All query words present in handle/name gets a bonus
    if (words.length > 1) {
      if (words.every(w => handle.includes(w))) score += 40;
      if (words.every(w => name.includes(w))) score += 30;
    }
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
    // Use the same search endpoint but query the exact handle — our search
    // backend returns richer data than doing a separate profile lookup.
    try {
      const r = await apiPost("/api/search-creators-instagram", { query: handle });
      const list = r.creators || [];
      const clean = handle.toLowerCase().replace(/^@/, "");
      return list.find(c => (c.username || "").toLowerCase() === clean) || null;
    } catch { return null; }
  };

  const doSearch = async () => {
    const rawQuery = (searchQuery || handleSearch || "").trim();
    if (!rawQuery) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    // If the user pasted a handle (either box), treat it as seed mode:
    // show that account first, then pull similar accounts from its bio
    // keywords.
    const isHandleInput = !!handleSearch.trim() || /^@[\w._-]+$/.test(rawQuery);
    if (isHandleInput && platformFilter !== "youtube" && platformFilter !== "tiktok") {
      const handleClean = rawQuery.replace(/^@/, "").trim();
      const seed = await fetchSingleInstagramByHandle(handleClean);
      if (seed && seed.description) {
        const keywords = extractBioKeywords(seed.description);
        if (keywords.length > 0) {
          try {
            // Run a bio-keyword search for similar accounts (top 3 keywords)
            const similarQuery = keywords.slice(0, 3).join(" ");
            const r = await apiPost("/api/search-creators-instagram", { query: similarQuery });
            let similar = (r.creators || []).filter(c => c.id !== seed.id);
            const watchIds = new Set(watchlist.map(w => w.id));
            similar = similar.filter(c => !watchIds.has(c.id));
            // Loose relevance check against the seed's OWN bio/keywords
            similar = similar.filter(c => {
              const desc = (c.description || "").toLowerCase();
              return keywords.filter(k => desc.includes(k)).length >= 2;
            });
            similar.sort((a, b) => {
              const hasA = (a.subscriberCount || 0) > 0 ? 1 : 0;
              const hasB = (b.subscriberCount || 0) > 0 ? 1 : 0;
              if (hasA !== hasB) return hasB - hasA;
              return (b.subscriberCount || 0) - (a.subscriberCount || 0);
            });
            setSuggestions([seed, ...similar]);
            setVisibleCount(50);
            setLoading(false);
            return;
          } catch {}
        }
        // Seed found but no bio keywords — just show the seed
        setSuggestions([seed]);
        setVisibleCount(50);
        setLoading(false);
        return;
      }
      // Seed not found → fall through to normal search
    }

    const query = rawQuery;
    try {
      const requests = [];
      if (platformFilter === "all" || platformFilter === "youtube") {
        requests.push(apiPost("/api/search-creators", { query, platform: "youtube" }).then(r => r.creators || []).catch(() => []));
      }
      if (platformFilter === "all" || platformFilter === "instagram") {
        requests.push(apiPost("/api/search-creators-instagram", { query }).then(r => r.creators || []).catch(() => []));
      }
      if (platformFilter === "all" || platformFilter === "tiktok") {
        requests.push(apiPost("/api/search-creators-tiktok", { query }).then(r => r.creators || []).catch(() => []));
      }

      const results = await Promise.all(requests);
      let allCreators = results.flat();

      if (accountSizeFilter !== "all") {
        allCreators = allCreators.filter(c => {
          const num = c.subscriberCount || parseFollowers(c.subscribers);
          if (accountSizeFilter === "large") return num >= 1000000;
          if (accountSizeFilter === "medium") return num >= 100000 && num < 1000000;
          if (accountSizeFilter === "small") return num < 100000;
          return true;
        });
      }

      const watchIds = new Set(watchlist.map(w => w.id));
      allCreators = allCreators.filter(c => !watchIds.has(c.id));

      // Drop results that aren't topically relevant to the query (full phrase
      // or at least two of the query words must actually appear).
      allCreators = allCreators.filter(c => queryRelevant(c, query));

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
    } catch (err) {
      setError(err.message || "Failed to search creators");
    } finally {
      setLoading(false);
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
          <p className="text-xs text-gray-500">@{creator.username || creator.name} · {creator.subscribers || formatNumber(creator.subscriberCount)} followers</p>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <h2 className="text-xl font-bold text-gray-900">Channels</h2>
        <p className="text-sm text-gray-500 mt-1">Pick which channels to include in your videos feed</p>
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
        <div className="flex gap-3 items-center flex-wrap">
          <input type="text" placeholder="Describe your niche (e.g., fitness, cooking, tech)"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          <input type="text" placeholder="Search by handle"
            value={handleSearch} onChange={(e) => setHandleSearch(e.target.value)} onKeyDown={handleKeyDown}
            className="w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />

          <div className="relative">
            <button onClick={() => { setShowPlatformDrop(!showPlatformDrop); setShowSizeDrop(false); }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
              {platformLabel[platformFilter]} <ChevronDown size={14} />
            </button>
            {showPlatformDrop && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowPlatformDrop(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-40">
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
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
              {sizeLabel[accountSizeFilter]} <ChevronDown size={14} />
            </button>
            {showSizeDrop && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSizeDrop(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-48">
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

          <button onClick={doSearch} disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
      </div>

      {activeTab === "suggestions" ? (
        <div className="flex gap-6">
          <div className="flex-1">
            {loading && <LoadingSpinner text="Searching creators across platforms..." />}
            {error && <ErrorMessage message={error} onRetry={doSearch} />}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.slice(0, visibleCount).map(creator => (
                    <CreatorCard key={creator.id} creator={creator} showSimilar action={
                      <button onClick={() => addToWatchlist(creator)}
                        className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        title="Add to Watchlist">
                        <Plus size={14} />
                      </button>
                    } />
                  ))}
                </div>
                {suggestions.length > visibleCount && (
                  <div className="mt-5 flex justify-center">
                    <button onClick={() => setVisibleCount(c => c + 25)}
                      className="px-5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                      Load more
                    </button>
                  </div>
                )}
                {suggestions.length > 0 && suggestions.length <= visibleCount && hasSearched && (
                  <div className="mt-5 text-center text-xs text-gray-400">
                    Showing all {suggestions.length} results — try a different search term for more.
                  </div>
                )}
                {suggestions.length === 0 && hasSearched && (
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

          <div className="w-72 flex-shrink-0">
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
                      <p className="text-xs text-gray-400">{creator.subscribers || formatNumber(creator.subscriberCount)}</p>
                    </div>
                    <button onClick={() => removeFromWatchlist(creator.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
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
