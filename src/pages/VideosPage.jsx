import { useState, useEffect, useCallback } from "react";
import {
  Users, BarChart3, Download, RefreshCw, ChevronDown, X, Video,
  TrendingUp, Eye, Flame, Heart, MessageCircle,
} from "lucide-react";
import { PlatformBadge } from "../components/PlatformIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { VideoDetailModal } from "../components/VideoDetailModal";
import { apiPost } from "../utils/api";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { formatNumber, timeAgo } from "../utils/format";
import { SAMPLE_VIDEOS } from "../utils/sampleData";

export const VideosPage = ({ watchlist, savedVideos, setSavedVideos, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [openVideo, setOpenVideo] = useState(null);
  const [videos, setVideos] = useState(SAMPLE_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [savedFilter, setSavedFilter] = useState("");
  const [savedFilters, setSavedFilters] = useState(() => loadFromStorage("optimus_saved_filters", []));
  const [channelFilter, setChannelFilter] = useState("all");
  const [outlierMin, setOutlierMin] = useState("");
  const [outlierMax, setOutlierMax] = useState("");
  const [viewsMin, setViewsMin] = useState("");
  const [viewsMax, setViewsMax] = useState("");
  const [engagementMin, setEngagementMin] = useState("");
  const [engagementMax, setEngagementMax] = useState("");
  const [postedWithin, setPostedWithin] = useState("");
  const [postedUnit, setPostedUnit] = useState("months");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [keywords, setKeywords] = useState("");
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showSavedFilterDropdown, setShowSavedFilterDropdown] = useState(false);
  const [showPostedUnitDropdown, setShowPostedUnitDropdown] = useState(false);

  useEffect(() => { saveToStorage("optimus_saved_filters", savedFilters); }, [savedFilters]);

  const fetchVideos = useCallback(async () => {
    if (watchlist.length === 0) { setVideos([]); return; }
    setLoading(true);
    setError(null);

    const MAX_IG_CREATORS = 8;          // cap so we don't burn Ultra quota (each creator = 2 calls)
    const IG_DELAY_MS = 1100;           // Ultra = 1 req/sec; 2 calls per creator, space them
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Skip fake SAMPLE_WATCHLIST entries (their IDs look like "yt_1" / "yt_2"
    // and aren't real Instagram accounts — they'd fail every fetch and eat
    // the rate limit).
    const isRealCreator = (c) => {
      if (!c || !c.username) return false;
      const id = String(c.id || "");
      // Sample IDs are in the shape "yt_1" — real IDs are either pure digits
      // (Instagram pk) or look like YouTube channel IDs (UC-prefixed).
      if (/^yt_\d+$/.test(id)) return false;
      return true;
    };

    const igCreators = watchlist.filter(w =>
      (w.platform || "").toLowerCase().includes("instagram") && isRealCreator(w)
    ).slice(0, MAX_IG_CREATORS);
    const ytCreators = watchlist.filter(w =>
      (w.platform || "").toLowerCase().includes("youtube") && w.id && isRealCreator(w)
    );

    const errors = [];
    const allVideos = [];

    try {
      // Instagram — SERIALIZE to respect Ultra's 1 req/sec rate limit.
      // The backend makes 2 calls per creator (user_id lookup + reels), so
      // we pause between creators to stay under the limit.
      for (const c of igCreators) {
        try {
          const r = await apiPost("/api/instagram-user-videos", {
            username: c.username,
            userId: c.id && /^\d+$/.test(String(c.id)) ? c.id : undefined,
            limit: 24,
          });
          const mapped = (r.videos || []).map(v => ({
            ...v,
            channel: { name: c.name || c.username, username: c.username, thumbnail: c.thumbnail },
          }));
          allVideos.push(...mapped);
        } catch (e) {
          errors.push(`${c.username}: ${e.message}`);
        }
        await sleep(IG_DELAY_MS);
      }

      // YouTube — parallel is fine, different API
      const ytPromises = ytCreators.slice(0, 5).map(c =>
        apiPost("/api/creator-videos", {
          creatorId: c.id,
          uploadsPlaylistId: c.uploadsPlaylistId,
          platform: "YouTube Shorts",
        }).then(r => (r.videos || []).map(v => ({
          ...v,
          channel: { name: c.name || c.username, username: c.username, thumbnail: c.thumbnail },
        }))).catch(e => { errors.push(`${c.username}: ${e.message}`); return []; })
      );
      const ytResults = await Promise.all(ytPromises);
      for (const list of ytResults) allVideos.push(...list);

      // Dedupe
      const seen = new Set();
      const deduped = allVideos.filter(v => { if (!v.id || seen.has(v.id)) return false; seen.add(v.id); return true; });
      setVideos(deduped);

      // Surface the first rate-limit-style error so the user knows why it
      // might look empty
      if (deduped.length === 0 && errors.length > 0) {
        const rateErr = errors.find(e => /rate|limit|429/i.test(e));
        setError(rateErr || errors[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  // Re-fetch whenever the watchlist changes so added creators appear
  // immediately when the user switches back to the Videos tab.
  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const filteredVideos = (activeTab === "feed" ? videos : savedVideos).filter(v => {
    if (outlierMin && (v.outlierScore || 0) < parseFloat(outlierMin)) return false;
    if (outlierMax && (v.outlierScore || 0) > parseFloat(outlierMax)) return false;
    if (viewsMin && (v.views || 0) < parseInt(viewsMin)) return false;
    if (viewsMax && (v.views || 0) > parseInt(viewsMax)) return false;
    if (engagementMin && (v.engagementRate || 0) < parseFloat(engagementMin) / 100) return false;
    if (engagementMax && (v.engagementRate || 0) > parseFloat(engagementMax) / 100) return false;
    if (postedWithin && v.publishedAt) {
      const days = parseInt(postedWithin) * (postedUnit === "months" ? 30 : postedUnit === "weeks" ? 7 : 1);
      const cutoff = Date.now() - days * 86400000;
      if (new Date(v.publishedAt).getTime() < cutoff) return false;
    }
    if (channelFilter !== "all" && (v.channel?.name || "") !== channelFilter) return false;
    if (platformFilter !== "all") {
      const p = (v.platform || "").toLowerCase();
      if (platformFilter === "youtube" && !p.includes("youtube")) return false;
      if (platformFilter === "instagram" && !p.includes("instagram")) return false;
      if (platformFilter === "tiktok" && !p.includes("tiktok")) return false;
    }
    if (keywords && !v.title.toLowerCase().includes(keywords.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "outlier") return (b.outlierScore || 0) - (a.outlierScore || 0);
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "engagement") return (b.engagementRate || 0) - (a.engagementRate || 0);
    return 0;
  });

  const saveToVault = (video) => {
    if (!savedVideos.find(v => v.id === video.id)) setSavedVideos(prev => [...prev, video]);
  };
  const removeFromVault = (videoId) => setSavedVideos(prev => prev.filter(v => v.id !== videoId));
  const isInVault = (videoId) => savedVideos.some(v => v.id === videoId);

  const clearFilters = () => {
    setOutlierMin(""); setOutlierMax(""); setViewsMin(""); setViewsMax("");
    setEngagementMin(""); setEngagementMax(""); setPostedWithin(""); setPostedUnit("months");
    setChannelFilter("all"); setPlatformFilter("all"); setKeywords(""); setSavedFilter("");
  };

  const currentFilterSnapshot = () => ({
    channelFilter, outlierMin, outlierMax, viewsMin, viewsMax,
    engagementMin, engagementMax, postedWithin, postedUnit, platformFilter, keywords,
  });

  const applyFilterSnapshot = (s) => {
    setChannelFilter(s.channelFilter ?? "all");
    setOutlierMin(s.outlierMin ?? ""); setOutlierMax(s.outlierMax ?? "");
    setViewsMin(s.viewsMin ?? ""); setViewsMax(s.viewsMax ?? "");
    setEngagementMin(s.engagementMin ?? ""); setEngagementMax(s.engagementMax ?? "");
    setPostedWithin(s.postedWithin ?? ""); setPostedUnit(s.postedUnit ?? "months");
    setPlatformFilter(s.platformFilter ?? "all");
    setKeywords(s.keywords ?? "");
  };

  const saveCurrentFilter = () => {
    const name = window.prompt("Name this filter:");
    if (!name) return;
    setSavedFilters(prev => [...prev.filter(f => f.name !== name), { name, ...currentFilterSnapshot() }]);
    setSavedFilter(name);
  };

  const exportVideos = () => {
    const rows = [["Title", "Channel", "Platform", "Views", "Outlier", "Engagement", "URL"]];
    filteredVideos.forEach(v => rows.push([
      v.title, v.channel?.name || "", v.platform || "",
      v.views || 0, v.outlierScore || "",
      v.engagementRate ? (v.engagementRate * 100).toFixed(2) + "%" : "",
      v.url || ""
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `optimus-videos-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const platformLabel = { all: "All platforms", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
  const postedUnitLabel = { days: "Days", weeks: "Weeks", months: "Months" };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Videos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === "feed" ? "Save high-performing videos to your vault to unlock deep analysis" : "Videos you've saved to your vault"}
        </p>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {["feed", "vault"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {tab === "feed" ? "Feed" : `Vault${savedVideos.length ? ` (${savedVideos.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {activeTab === "feed" && (
            <button onClick={() => setCurrentPage("channels")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Users size={14} /> Configure channels
            </button>
          )}

          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <BarChart3 size={14} /> Sort by
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 w-44">
                  {[
                    { key: "newest", label: "Newest" },
                    { key: "outlier", label: "Outlier score" },
                    { key: "views", label: "Views" },
                    { key: "engagement", label: "Engagement" },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === opt.key ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={exportVideos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download size={14} /> Export
          </button>

          <button onClick={fetchVideos} disabled={loading} title="Refresh"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="w-60 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
            </div>
            <div className="space-y-3.5">
              <div className="relative">
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Saved Filters</label>
                <button onClick={() => setShowSavedFilterDropdown(!showSavedFilterDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors flex items-center justify-between">
                  <span className={savedFilter ? "text-gray-900" : "text-gray-400"}>
                    {savedFilter || "Pick one to apply"}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showSavedFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSavedFilterDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
                      {savedFilters.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400">No saved filters yet</div>
                      ) : savedFilters.map(f => (
                        <div key={f.name} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group">
                          <button onClick={() => { applyFilterSnapshot(f); setSavedFilter(f.name); setShowSavedFilterDropdown(false); }}
                            className={`flex-1 text-left text-sm ${savedFilter === f.name ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                            {f.name}
                          </button>
                          <button onClick={() => setSavedFilters(prev => prev.filter(x => x.name !== f.name))}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Channels</label>
                <button onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors flex items-center justify-between">
                  <span className={channelFilter === "all" ? "text-gray-400" : "text-gray-900"}>
                    {channelFilter === "all" ? "All channels" : channelFilter}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showChannelDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowChannelDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
                      <button onClick={() => { setChannelFilter("all"); setShowChannelDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${channelFilter === "all" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                        All channels
                      </button>
                      {watchlist.map(creator => (
                        <button key={creator.id} onClick={() => { setChannelFilter(creator.name || creator.username); setShowChannelDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                            channelFilter === (creator.name || creator.username) ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}>
                          {creator.thumbnail && <img src={creator.thumbnail} alt="" className="w-5 h-5 rounded-full object-cover" />}
                          <span className="truncate">{creator.name || creator.username}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Outlier score</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="1" value={outlierMin} onChange={(e) => setOutlierMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="100x" value={outlierMax} onChange={(e) => setOutlierMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Views</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="0" value={viewsMin} onChange={(e) => setViewsMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="10,000,000" value={viewsMax} onChange={(e) => setViewsMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Engagement</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="0%" value={engagementMin} onChange={(e) => setEngagementMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="100%" value={engagementMax} onChange={(e) => setEngagementMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Posted in last</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="0" value={postedWithin} onChange={(e) => setPostedWithin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <div className="relative flex-1">
                    <button onClick={() => setShowPostedUnitDropdown(!showPostedUnitDropdown)}
                      className="w-full text-left px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:border-gray-300 flex items-center justify-between">
                      <span>{postedUnitLabel[postedUnit]}</span>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                    {showPostedUnitDropdown && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowPostedUnitDropdown(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                          {Object.entries(postedUnitLabel).map(([val, label]) => (
                            <button key={val} onClick={() => { setPostedUnit(val); setShowPostedUnitDropdown(false); }}
                              className={`w-full text-left px-3 py-1.5 text-xs ${postedUnit === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Platform</label>
                <button onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors flex items-center justify-between">
                  <span className={platformFilter === "all" ? "text-gray-400" : "text-gray-900"}>{platformLabel[platformFilter]}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {showPlatformDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowPlatformDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                      {Object.entries(platformLabel).map(([val, label]) => (
                        <button key={val} onClick={() => { setPlatformFilter(val); setShowPlatformDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${platformFilter === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Keywords</label>
                <input type="text" placeholder="Search captions and titles" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <button onClick={saveCurrentFilter}
                className="w-full mt-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Save filter
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {loading && <LoadingSpinner text="Fetching videos..." />}
          {error && <ErrorMessage message={error} onRetry={fetchVideos} />}
          {!loading && (
            <>
              <div className="grid gap-4 grid-cols-3 xl:grid-cols-4">
                {filteredVideos.map(video => (
                  <div key={video.id} className="group cursor-pointer"
                    onClick={() => setOpenVideo(video)}
                    onMouseEnter={() => setHoveredVideoId(video.id)}
                    onMouseLeave={() => setHoveredVideoId(null)}>
                    <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-2" style={{ paddingBottom: "177.78%" }}>
                      <img src={video.thumbnail} alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${video.id}/270/480`; }} />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      <PlatformBadge platform={video.platform} />
                      <div className="absolute inset-x-0 bottom-0 p-2.5 pointer-events-none">
                        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug drop-shadow">
                          {video.title}
                        </p>
                      </div>
                      <div className={`absolute top-2 right-2 transition-opacity ${hoveredVideoId === video.id || isInVault(video.id) ? "opacity-100" : "opacity-0"}`}>
                        <button onClick={(e) => { e.stopPropagation(); isInVault(video.id) ? removeFromVault(video.id) : saveToVault(video); }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            isInVault(video.id) ? "bg-blue-500 text-white" : "bg-white/95 text-gray-700 hover:bg-white backdrop-blur"
                          }`}>
                          {isInVault(video.id) ? "Saved" : "Save to vault"}
                        </button>
                      </div>
                    </div>
                    <div className="px-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span className="truncate">@{(video.channel?.username || video.channel?.name || "creator").toLowerCase().replace(/\s+/g, "")}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex-shrink-0">{video.timeAgo || timeAgo(video.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1 text-[11px] flex-wrap">
                        {video.outlierScore >= 1.0 && (
                          <span className="text-orange-500 font-semibold flex items-center gap-0.5" title={`${video.outlierScore.toFixed(1)}x creator's avg views`}>
                            <TrendingUp size={10} /> {video.outlierScore.toFixed(1)}x
                          </span>
                        )}
                        <span className="text-gray-600 flex items-center gap-0.5" title="Views">
                          <Eye size={10} /> {video.viewsFormatted || formatNumber(video.views)}
                        </span>
                        {video.likes != null && video.likes > 0 && (
                          <span className="text-gray-600 flex items-center gap-0.5" title="Likes">
                            <Heart size={10} /> {formatNumber(video.likes)}
                          </span>
                        )}
                        {video.comments != null && video.comments > 0 && (
                          <span className="text-gray-600 flex items-center gap-0.5" title="Comments">
                            <MessageCircle size={10} /> {formatNumber(video.comments)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Video size={20} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    {watchlist.length === 0 ? "No creators in your watchlist yet" : "No videos found"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 mb-3">
                    {watchlist.length === 0
                      ? "Head to Channels, search a niche, and add creators to your watchlist — their top reels will show up here."
                      : activeTab === "feed"
                        ? "Try adjusting your filters, or add more creators to your watchlist."
                        : "Save videos from your feed to see them here."}
                  </p>
                  {watchlist.length === 0 && (
                    <button onClick={() => setCurrentPage("channels")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                      <Users size={14} /> Go to Channels
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <VideoDetailModal
        video={openVideo}
        onClose={() => setOpenVideo(null)}
        onSaveToggle={(v) => isInVault(v.id) ? removeFromVault(v.id) : saveToVault(v)}
        isSaved={openVideo ? isInVault(openVideo.id) : false}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};
