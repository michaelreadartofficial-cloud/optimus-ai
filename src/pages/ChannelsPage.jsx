import { useState } from "react";
import { Search, ChevronDown, Plus, X, Loader2 } from "lucide-react";
import { PlatformIcon } from "../components/PlatformIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { apiPost } from "../utils/api";
import { formatNumber, parseFollowers } from "../utils/format";

export const ChannelsPage = ({ watchlist, setWatchlist }) => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [handleSearch, setHandleSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountSizeFilter, setAccountSizeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(25);
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

  const doSearch = async () => {
    const query = (searchQuery || handleSearch || "").trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

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

      // Sort by relevance first (how well the creator matches the query),
      // then prefer Instagram → YouTube → TikTok when relevance ties,
      // then finally fall back to follower count.
      allCreators.sort((a, b) => {
        const scoreDiff = relevanceScore(b, query) - relevanceScore(a, query);
        if (scoreDiff !== 0) return scoreDiff;
        const rankDiff = platformRank(a.platform) - platformRank(b.platform);
        if (rankDiff !== 0) return rankDiff;
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      });

      setSuggestions(allCreators);
      setVisibleCount(25);
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

  const platformLabel = { all: "Platform", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
  const sizeLabel = { all: "Account size", large: "Large (1M+)", medium: "Medium (100K-1M)", small: "Small (<100K)" };

  const CreatorCard = ({ creator, action }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-300 transition-all group">
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
      {action}
    </div>
  );

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
                    <CreatorCard key={creator.id} creator={creator} action={
                      <button onClick={() => addToWatchlist(creator)}
                        className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
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
                      Load more ({suggestions.length - visibleCount} remaining)
                    </button>
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => removeFromWatchlist(creator.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
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
