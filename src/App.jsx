import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, TrendingUp, Zap, BookOpen, Archive, Settings, Eye, ThumbsUp,
  MessageCircle, Clock, Star, Copy, ChevronDown, Plus, Sparkles, RefreshCw,
  X, BarChart3, Users, Video, Bookmark, Flame, ArrowRight, Lightbulb,
  PenTool, Layers, Play, Filter, Grid, List, Trash2, Download, Check,
  ChevronLeft, Share2, Code, AlertCircle, Heart, Palette,
  FileText, Target, LayoutGrid, Activity, Bell, Moon, Sun, Key, Globe,
  ChevronRight, ExternalLink, Hash, Calendar, Wand2, Link, SlidersHorizontal,
  HelpCircle, Upload, Loader2, FolderOpen, UserCircle
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const STORAGE_KEYS = {
  watchlist: "optimus_watchlist",
  savedVideos: "optimus_saved_videos",
  scriptsWritten: "optimus_scripts_written",
  savedScripts: "optimus_saved_scripts",
};

const loadFromStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
};

const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const formatNumber = (n) => {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const parseFollowers = (str) => {
  if (!str) return 0;
  const s = str.toString().replace(/,/g, "");
  if (s.includes("M")) return parseFloat(s) * 1000000;
  if (s.includes("K")) return parseFloat(s) * 1000;
  return parseInt(s) || 0;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  if (days < 30) return Math.floor(days / 7) + "w ago";
  return Math.floor(days / 30) + "mo ago";
};

// ============================================================
// SAMPLE DATA (fallback when APIs are unavailable)
// ============================================================

const SAMPLE_WATCHLIST = [
  { id: "yt_1", name: "Macro Daddy", username: "_macro_daddy", platform: "Instagram Reels", subscribers: "773K", subscriberCount: 773000, thumbnail: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" },
  { id: "yt_2", name: "Alexa Stanco", username: "alexastancofit", platform: "Instagram Reels", subscribers: "409K", subscriberCount: 409000, thumbnail: "https://ui-avatars.com/api/?name=AC&background=4ECDC4&color=fff" },
  { id: "yt_3", name: "Coach Dango", username: "coachdango", platform: "Instagram Reels", subscribers: "1.4M", subscriberCount: 1400000, thumbnail: "https://ui-avatars.com/api/?name=CD&background=95E1D3&color=fff" },
  { id: "yt_4", name: "Dan Martell", username: "danmartell", platform: "YouTube Shorts", subscribers: "2.2M", subscriberCount: 2200000, thumbnail: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" },
  { id: "yt_5", name: "Falke Fit", username: "falkefit", platform: "TikTok", subscribers: "339K", subscriberCount: 339000, thumbnail: "https://ui-avatars.com/api/?name=FF&background=AA96DA&color=fff" },
];

const SAMPLE_VIDEOS = [
  { id: "sv_1", title: "Low calorie protein swaps you need to try", channel: { name: "Macro Daddy", thumbnail: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v1/270/480", outlierScore: 1.3, views: 18000, viewsFormatted: "18K", likes: 720, likesFormatted: "720", timeAgo: "1d ago", url: "#" },
  { id: "sv_2", title: "Have you ever heard of this fitness hack?", channel: { name: "Alexa Stanco", thumbnail: "https://ui-avatars.com/api/?name=AC&background=4ECDC4&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v2/270/480", outlierScore: 1.0, views: 13000, viewsFormatted: "13K", likes: 520, likesFormatted: "520", timeAgo: "1d ago", url: "#" },
  { id: "sv_3", title: "Transform your body with this trick", channel: { name: "Coach Dango", thumbnail: "https://ui-avatars.com/api/?name=CD&background=95E1D3&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v3/270/480", outlierScore: 1.5, views: 25000, viewsFormatted: "25K", likes: 1500, likesFormatted: "1.5K", timeAgo: "2d ago", url: "#" },
  { id: "sv_4", title: "Fitness myths debunked in 60 seconds", channel: { name: "Dan Martell", thumbnail: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v4/270/480", outlierScore: 2.1, views: 42000, viewsFormatted: "42K", likes: 3360, likesFormatted: "3.4K", timeAgo: "3d ago", url: "#" },
  { id: "sv_5", title: "This changed my workout routine forever", channel: { name: "Falke Fit", thumbnail: "https://ui-avatars.com/api/?name=FF&background=AA96DA&color=fff" }, platform: "TikTok", thumbnail: "https://picsum.photos/seed/v5/270/480", outlierScore: 1.2, views: 19000, viewsFormatted: "19K", likes: 950, likesFormatted: "950", timeAgo: "1d ago", url: "#" },
  { id: "sv_6", title: "The #1 mistake people make at the gym", channel: { name: "Macro Daddy", thumbnail: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v6/270/480", outlierScore: 1.8, views: 35000, viewsFormatted: "35K", likes: 2450, likesFormatted: "2.5K", timeAgo: "2d ago", url: "#" },
  { id: "sv_7", title: "Quick abs workout for busy people", channel: { name: "Alexa Stanco", thumbnail: "https://ui-avatars.com/api/?name=AC&background=4ECDC4&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v7/270/480", outlierScore: 1.4, views: 22000, viewsFormatted: "22K", likes: 1320, likesFormatted: "1.3K", timeAgo: "1d ago", url: "#" },
  { id: "sv_8", title: "Nutrition secrets from pro athletes", channel: { name: "Dan Martell", thumbnail: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v8/270/480", outlierScore: 1.6, views: 28000, viewsFormatted: "28K", likes: 1960, likesFormatted: "2K", timeAgo: "2d ago", url: "#" },
  { id: "sv_9", title: "5 minute morning energy boost", channel: { name: "Coach Dango", thumbnail: "https://ui-avatars.com/api/?name=CD&background=95E1D3&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v9/270/480", outlierScore: 0.9, views: 11000, viewsFormatted: "11K", likes: 330, likesFormatted: "330", timeAgo: "3d ago", url: "#" },
  { id: "sv_10", title: "How I get shredded without starving", channel: { name: "Falke Fit", thumbnail: "https://ui-avatars.com/api/?name=FF&background=AA96DA&color=fff" }, platform: "TikTok", thumbnail: "https://picsum.photos/seed/v10/270/480", outlierScore: 2.0, views: 38000, viewsFormatted: "38K", likes: 3040, likesFormatted: "3K", timeAgo: "1d ago", url: "#" },
  { id: "sv_11", title: "Mobility routine that actually works", channel: { name: "Macro Daddy", thumbnail: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v11/270/480", outlierScore: 1.1, views: 16000, viewsFormatted: "16K", likes: 640, likesFormatted: "640", timeAgo: "2d ago", url: "#" },
  { id: "sv_12", title: "Meal prep for the entire week", channel: { name: "Dan Martell", thumbnail: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" }, platform: "YouTube Shorts", thumbnail: "https://picsum.photos/seed/v12/270/480", outlierScore: 1.7, views: 32000, viewsFormatted: "32K", likes: 1920, likesFormatted: "1.9K", timeAgo: "3d ago", url: "#" },
];

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

const PlatformIcon = ({ platform, size = 20 }) => {
  const isIG = platform?.toLowerCase().includes("instagram");
  const isTT = platform?.toLowerCase().includes("tiktok");
  const isYT = platform?.toLowerCase().includes("youtube");
  const color = isIG ? "#E1306C" : isTT ? "#000000" : isYT ? "#FF0000" : "#999";
  const label = isIG ? "IG" : isTT ? "TT" : isYT ? "YT" : "?";
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", backgroundColor: color,
      color: "white", fontSize: size * 0.42, fontWeight: 700,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>{label}</span>
  );
};

const PlatformBadge = ({ platform }) => {
  const isIG = platform?.toLowerCase().includes("instagram");
  const isTT = platform?.toLowerCase().includes("tiktok");
  const isYT = platform?.toLowerCase().includes("youtube");
  const name = isIG ? "Instagram" : isTT ? "TikTok" : isYT ? "YouTube Shorts" : platform;
  const color = isIG ? "#E1306C" : isTT ? "#000000" : isYT ? "#FF0000" : "#666";
  const label = isIG ? "IG" : isTT ? "TT" : isYT ? "YT" : "?";
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(255,255,255,0.9)", color, backdropFilter: "blur(4px)" }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%", backgroundColor: color,
        display: "inline-flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "white", fontSize: 7, fontWeight: 700 }}>{label}</span>
      </span>
      {name}
    </div>
  );
};

const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <Loader2 size={24} className="animate-spin text-gray-400" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <AlertCircle size={24} className="text-red-400" />
    <p className="text-sm text-red-500">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
        <RefreshCw size={12} /> Try again
      </button>
    )}
  </div>
);

// ============================================================
// API HELPER
// ============================================================

const apiPost = async (endpoint, body) => {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
};

// ============================================================
// VIDEO DETAIL MODAL
// ============================================================

const getYouTubeEmbedId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const VideoDetailModal = ({ video, onClose, onSaveToggle, isSaved, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("hook");
  const [analysis, setAnalysis] = useState({ hook: null, transcript: null, whyViral: null });
  const [analyzing, setAnalyzing] = useState({ hook: false, transcript: false, whyViral: false });
  const [error, setError] = useState(null);

  if (!video) return null;

  const ytId = getYouTubeEmbedId(video.url);
  const platformUrl = video.url || "#";

  const runAnalysis = async (kind) => {
    setError(null);
    setAnalyzing(p => ({ ...p, [kind]: true }));
    try {
      const prompts = {
        hook: `Analyze the opening hook of this short-form video. Title: "${video.title}". Platform: ${video.platform}. Explain in 3-4 bullets why the hook works — what pattern interrupt, curiosity loop, or tension it uses.`,
        transcript: `This is a short-form video titled "${video.title}" on ${video.platform}. Without making up content, describe what a typical script/transcript for a video with this title would cover in 4-6 beats.`,
        whyViral: `This video got ${(video.views || 0).toLocaleString()} views${video.outlierScore ? ` with an outlier score of ${video.outlierScore.toFixed(1)}x` : ""}. Title: "${video.title}". In 3-5 bullets explain: what format/framework, what emotional driver, what replicable tactic makes this work.`
      };
      const r = await apiPost("/api/generate-script", { prompt: prompts[kind], length: "short" });
      setAnalysis(p => ({ ...p, [kind]: r.script || r.content || r.text || "No response" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(p => ({ ...p, [kind]: false }));
    }
  };

  const stats = [
    video.outlierScore >= 1 && { icon: TrendingUp, label: "Outlier", value: `${video.outlierScore.toFixed(1)}x`, color: "text-orange-500" },
    { icon: Eye, label: "Views", value: video.viewsFormatted || formatNumber(video.views), color: "text-gray-700" },
    video.likes != null && { icon: Heart, label: "Likes", value: formatNumber(video.likes), color: "text-gray-700" },
    video.comments != null && { icon: MessageCircle, label: "Comments", value: formatNumber(video.comments), color: "text-gray-700" },
    video.engagementRate != null && { icon: Flame, label: "Engagement", value: `${(video.engagementRate * 100).toFixed(1)}%`, color: "text-gray-700" },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        {/* Left: video */}
        <div className="md:w-[340px] flex-shrink-0 bg-gray-950 relative">
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 md:hidden p-1.5 rounded-full bg-white/90 hover:bg-white transition">
            <X size={16} className="text-gray-700" />
          </button>
          <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
            {ytId ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a href={platformUrl} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center group">
                <img src={video.thumbnail} alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.target.src = `https://picsum.photos/seed/${video.id}/270/480`; }} />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition" />
                <div className="relative w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition">
                  <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Right: info + analysis */}
        <div className="flex-1 min-w-0 flex flex-col max-h-[90vh]">
          <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-3">{video.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <PlatformIcon platform={video.platform} size={14} />
                <span className="truncate">@{(video.channel?.username || video.channel?.name || "creator").toLowerCase().replace(/\s+/g, "")}</span>
                <span className="text-gray-300">·</span>
                <span>{video.timeAgo || timeAgo(video.publishedAt)}</span>
              </div>
            </div>
            <button onClick={onClose} className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 transition flex-shrink-0">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Stats grid */}
          <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-3 sm:grid-cols-5 gap-3">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                  <s.icon size={11} /> {s.label}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2">
            <button onClick={() => onSaveToggle(video)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isSaved ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}>
              <Bookmark size={13} /> {isSaved ? "Saved to vault" : "Save to vault"}
            </button>
            <button onClick={() => { onSaveToggle(video); setCurrentPage("scripts"); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <PenTool size={13} /> Write script from this
            </button>
            <a href={platformUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <ExternalLink size={13} /> Open on {video.platform?.includes("youtube") ? "YouTube" : video.platform?.includes("instagram") ? "Instagram" : video.platform?.includes("tiktok") ? "TikTok" : "platform"}
            </a>
          </div>

          {/* Analysis tabs */}
          <div className="px-5 pt-3 border-b border-gray-100 flex gap-1">
            {[
              { key: "hook", label: "Hook" },
              { key: "transcript", label: "Transcript" },
              { key: "whyViral", label: "Why it went viral" },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                  activeTab === t.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Analysis body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-700 leading-relaxed">
            {error && <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 rounded-lg">{error}</div>}
            {analyzing[activeTab] ? (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Loader2 size={14} className="animate-spin" /> Analyzing with AI…
              </div>
            ) : analysis[activeTab] ? (
              <div className="whitespace-pre-wrap">{analysis[activeTab]}</div>
            ) : (
              <div className="text-center py-8">
                <Sparkles size={20} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">
                  {activeTab === "hook" && "Break down the opening hook — what pattern, what tension."}
                  {activeTab === "transcript" && "Summarise what the video likely covers beat-by-beat."}
                  {activeTab === "whyViral" && "Get the format, emotional driver, and replicable tactic."}
                </p>
                <button onClick={() => runAnalysis(activeTab)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition">
                  <Sparkles size={12} /> Analyze with AI
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHANNELS PAGE
// ============================================================

const ChannelsPage = ({ watchlist, setWatchlist }) => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [handleSearch, setHandleSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountSizeFilter, setAccountSizeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSizeDrop, setShowSizeDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = async () => {
    const query = (searchQuery || handleSearch || "").trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Fetch from all platforms in parallel
      const requests = [];
      if (platformFilter === "all" || platformFilter === "youtube") {
        requests.push(
          apiPost("/api/search-creators", { query, platform: "youtube" })
            .then(r => r.creators || [])
            .catch(() => [])
        );
      }
      if (platformFilter === "all" || platformFilter === "instagram") {
        requests.push(
          apiPost("/api/search-creators-instagram", { query })
            .then(r => r.creators || [])
            .catch(() => [])
        );
      }
      if (platformFilter === "all" || platformFilter === "tiktok") {
        requests.push(
          apiPost("/api/search-creators-tiktok", { query })
            .then(r => r.creators || [])
            .catch(() => [])
        );
      }

      const results = await Promise.all(requests);
      let allCreators = results.flat();

      // Filter by account size
      if (accountSizeFilter !== "all") {
        allCreators = allCreators.filter(c => {
          const num = c.subscriberCount || parseFollowers(c.subscribers);
          if (accountSizeFilter === "large") return num >= 1000000;
          if (accountSizeFilter === "medium") return num >= 100000 && num < 1000000;
          if (accountSizeFilter === "small") return num < 100000;
          return true;
        });
      }

      // Remove any that are already in watchlist
      const watchIds = new Set(watchlist.map(w => w.id));
      allCreators = allCreators.filter(c => !watchIds.has(c.id));

      // Sort by subscriber count
      allCreators.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));

      setSuggestions(allCreators);
    } catch (err) {
      setError(err.message || "Failed to search creators");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") doSearch();
  };

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
  const displaySuggestions = suggestions;

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

      {/* Tabs */}
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <input type="text" placeholder="Describe your niche (e.g., fitness, cooking, tech)"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          <input type="text" placeholder="Search by handle"
            value={handleSearch} onChange={(e) => setHandleSearch(e.target.value)} onKeyDown={handleKeyDown}
            className="w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />

          {/* Platform Dropdown */}
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

          {/* Account Size Dropdown */}
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

      {/* Content */}
      {activeTab === "suggestions" ? (
        <div className="flex gap-6">
          <div className="flex-1">
            {loading && <LoadingSpinner text="Searching creators across platforms..." />}
            {error && <ErrorMessage message={error} onRetry={doSearch} />}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displaySuggestions.map(creator => (
                    <CreatorCard key={creator.id} creator={creator} action={
                      <button onClick={() => addToWatchlist(creator)}
                        className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title="Add to Watchlist">
                        <Plus size={14} />
                      </button>
                    } />
                  ))}
                </div>
                {displaySuggestions.length === 0 && hasSearched && (
                  <div className="text-center py-12 text-gray-500 text-sm">No creators found. Try a different search term.</div>
                )}
                {!hasSearched && displaySuggestions.length === 0 && (
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

          {/* Watchlist Sidebar */}
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
        /* Watchlist Tab */
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

// ============================================================
// VIDEOS PAGE
// ============================================================

const VideosPage = ({ watchlist, savedVideos, setSavedVideos, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [openVideo, setOpenVideo] = useState(null);
  const [videos, setVideos] = useState(SAMPLE_VIDEOS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
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

  // Fetch videos from API for watchlisted YouTube creators
  const fetchVideos = useCallback(async () => {
    if (watchlist.length === 0) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to discover videos based on watchlist creator names
      const ytCreators = watchlist.filter(w => w.platform?.toLowerCase().includes("youtube") && w.id);
      const otherCreators = watchlist.filter(w => !w.platform?.toLowerCase().includes("youtube"));

      const videoPromises = [];

      // Fetch videos for YouTube creators
      for (const creator of ytCreators.slice(0, 5)) {
        videoPromises.push(
          apiPost("/api/creator-videos", {
            creatorId: creator.id,
            uploadsPlaylistId: creator.uploadsPlaylistId,
            platform: "YouTube Shorts"
          }).then(r => (r.videos || []).map(v => ({ ...v, channel: { name: creator.name || creator.username, thumbnail: creator.thumbnail } })))
            .catch(() => [])
        );
      }

      // Also discover videos by general niche query
      videoPromises.push(
        apiPost("/api/discover-videos", { query: "fitness shorts" })
          .then(r => r.videos || [])
          .catch(() => [])
      );

      const results = await Promise.all(videoPromises);
      let allVideos = results.flat();

      // Deduplicate by id
      const seen = new Set();
      allVideos = allVideos.filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      if (allVideos.length > 0) {
        setVideos(allVideos);
      }
      // If API returned nothing, keep sample data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchVideos();
  }, []);

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
    if (!savedVideos.find(v => v.id === video.id)) {
      setSavedVideos(prev => [...prev, video]);
    }
  };

  const removeFromVault = (videoId) => {
    setSavedVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const isInVault = (videoId) => savedVideos.some(v => v.id === videoId);

  const clearFilters = () => {
    setOutlierMin(""); setOutlierMax("");
    setViewsMin(""); setViewsMax("");
    setEngagementMin(""); setEngagementMax("");
    setPostedWithin(""); setPostedUnit("months");
    setChannelFilter("all"); setPlatformFilter("all");
    setKeywords(""); setSavedFilter("");
  };

  const currentFilterSnapshot = () => ({
    channelFilter, outlierMin, outlierMax, viewsMin, viewsMax,
    engagementMin, engagementMax, postedWithin, postedUnit,
    platformFilter, keywords,
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

      {/* Tabs + Toolbar */}
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

          <button onClick={fetchVideos} disabled={loading}
            title="Refresh"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter Sidebar + Video Grid */}
      <div className="flex gap-5">
        <div className="w-60 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
            </div>
            <div className="space-y-3.5">
              {/* Saved Filters */}
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

              {/* Channels */}
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

              {/* Outlier score */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Outlier score</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="1" value={outlierMin} onChange={(e) => setOutlierMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="100x" value={outlierMax} onChange={(e) => setOutlierMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Views */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Views</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="0" value={viewsMin} onChange={(e) => setViewsMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="10,000,000" value={viewsMax} onChange={(e) => setViewsMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Engagement */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Engagement</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="0%" value={engagementMin} onChange={(e) => setEngagementMin(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" placeholder="100%" value={engagementMax} onChange={(e) => setEngagementMax(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Posted in last */}
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

              {/* Platform */}
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

              {/* Keywords */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 font-medium">Keywords</label>
                <input type="text" placeholder="Search captions and titles" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              {/* Save Filter */}
              <button onClick={saveCurrentFilter}
                className="w-full mt-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Save filter
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
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
                    {/* 9:16 thumbnail with overlays */}
                    <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-2" style={{ paddingBottom: "177.78%" }}>
                      <img src={video.thumbnail} alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${video.id}/270/480`; }} />
                      {/* Gradient overlay for title readability */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      <PlatformBadge platform={video.platform} />
                      {/* Title overlaid on bottom of thumbnail */}
                      <div className="absolute inset-x-0 bottom-0 p-2.5 pointer-events-none">
                        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug drop-shadow">
                          {video.title}
                        </p>
                      </div>
                      {/* Save-to-vault button top-right on hover or when saved */}
                      <div className={`absolute top-2 right-2 transition-opacity ${hoveredVideoId === video.id || isInVault(video.id) ? "opacity-100" : "opacity-0"}`}>
                        <button onClick={(e) => { e.stopPropagation(); isInVault(video.id) ? removeFromVault(video.id) : saveToVault(video); }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            isInVault(video.id) ? "bg-blue-500 text-white" : "bg-white/95 text-gray-700 hover:bg-white backdrop-blur"
                          }`}>
                          {isInVault(video.id) ? "Saved" : "Save to vault"}
                        </button>
                      </div>
                    </div>
                    {/* Meta below */}
                    <div className="px-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span className="truncate">@{(video.channel?.username || video.channel?.name || "creator").toLowerCase().replace(/\s+/g, "")}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex-shrink-0">{video.timeAgo || timeAgo(video.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px]">
                        {video.outlierScore >= 1.0 && (
                          <span className="text-orange-500 font-semibold flex items-center gap-0.5">
                            <TrendingUp size={10} /> {video.outlierScore.toFixed(1)}x
                          </span>
                        )}
                        <span className="text-gray-600 flex items-center gap-0.5">
                          <Eye size={10} /> {video.viewsFormatted || formatNumber(video.views)}
                        </span>
                        {video.engagementRate != null && (
                          <span className="text-gray-600 flex items-center gap-0.5">
                            <Flame size={10} /> {(video.engagementRate * 100).toFixed(1)}%
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
                  <p className="text-gray-500 text-sm font-medium">No videos found</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {activeTab === "feed" ? "Try adjusting your filters or add more channels to your watchlist." : "Save videos from your feed to see them here."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video detail modal */}
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

// ============================================================
// SCRIPTS PAGE (with real AI generation)
// ============================================================

const ScriptsPage = ({ savedVideos }) => {
  const [savedScripts, setSavedScripts] = useState(() => loadFromStorage(STORAGE_KEYS.savedScripts, []));
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorMode, setGeneratorMode] = useState("idea");
  const [generatorInput, setGeneratorInput] = useState("");
  const [generatorTone, setGeneratorTone] = useState("Energetic");
  const [generatorDuration, setGeneratorDuration] = useState("30-45 seconds");
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [genError, setGenError] = useState(null);

  // Hooks generator
  const [hookTopic, setHookTopic] = useState("");
  const [generatedHooks, setGeneratedHooks] = useState([]);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [hookError, setHookError] = useState(null);

  const [activeTab, setActiveTab] = useState("generate");

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.savedScripts, savedScripts);
  }, [savedScripts]);

  const generateScript = async () => {
    if (!generatorInput.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedScript(null);

    try {
      const result = await apiPost("/api/generate-script", {
        mode: generatorMode,
        input: generatorInput,
        duration: generatorDuration,
        tone: generatorTone,
      });
      setGeneratedScript(result);
    } catch (err) {
      setGenError(err.message || "Failed to generate script");
    } finally {
      setGenerating(false);
    }
  };

  const generateHooks = async () => {
    if (!hookTopic.trim()) return;
    setGeneratingHooks(true);
    setHookError(null);
    setGeneratedHooks([]);

    try {
      const result = await apiPost("/api/generate-hooks", { topic: hookTopic });
      setGeneratedHooks(result.hooks || []);
    } catch (err) {
      setHookError(err.message || "Failed to generate hooks");
    } finally {
      setGeneratingHooks(false);
    }
  };

  const saveScript = () => {
    if (!generatedScript) return;
    const script = {
      id: Date.now(),
      ...generatedScript,
      mode: generatorMode,
      input: generatorInput,
      tone: generatorTone,
      duration: generatorDuration,
      createdAt: new Date().toISOString(),
    };
    setSavedScripts(prev => [script, ...prev]);
    setGeneratedScript(null);
    setGeneratorInput("");
    setShowGenerator(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scripts</h1>
        <p className="text-sm text-gray-500 mt-1">Generate viral video scripts powered by AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Scripts Generated", value: savedScripts.length, gradient: "from-purple-400 to-pink-500" },
          { label: "Videos in Vault", value: savedVideos.length, gradient: "from-blue-400 to-cyan-500" },
          { label: "Hooks Generated", value: generatedHooks.length, gradient: "from-orange-400 to-pink-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} mb-2`} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "generate", label: "Generate Script" },
          { key: "hooks", label: "Hook Generator" },
          { key: "saved", label: `Saved (${savedScripts.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Script Tab */}
      {activeTab === "generate" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Mode</label>
            <div className="flex gap-2">
              {[
                { key: "idea", label: "From Idea", desc: "Turn a concept into a full script" },
                { key: "outline", label: "From Outline", desc: "Expand bullet points into a script" },
                { key: "polish", label: "Polish Draft", desc: "Refine an existing draft" },
              ].map(m => (
                <button key={m.key} onClick={() => setGeneratorMode(m.key)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    generatorMode === m.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <p className={`text-sm font-medium ${generatorMode === m.key ? "text-blue-700" : "text-gray-900"}`}>{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              {generatorMode === "idea" ? "Your video idea" : generatorMode === "outline" ? "Your outline" : "Your draft"}
            </label>
            <textarea value={generatorInput} onChange={(e) => setGeneratorInput(e.target.value)}
              placeholder={generatorMode === "idea" ? "e.g., Why most people fail at meal prep and the simple fix" : generatorMode === "outline" ? "- Hook: shocking stat\n- Point 1: common mistake\n- Point 2: the fix\n- CTA: follow for more" : "Paste your rough draft here..."}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tone</label>
              <select value={generatorTone} onChange={(e) => setGeneratorTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>Energetic</option>
                <option>Casual</option>
                <option>Professional</option>
                <option>Humorous</option>
                <option>Inspirational</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Duration</label>
              <select value={generatorDuration} onChange={(e) => setGeneratorDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>15-30 seconds</option>
                <option>30-45 seconds</option>
                <option>45-60 seconds</option>
                <option>60-90 seconds</option>
              </select>
            </div>
          </div>

          <button onClick={generateScript} disabled={generating || !generatorInput.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Script</>}
          </button>

          {genError && <ErrorMessage message={genError} onRetry={generateScript} />}

          {generatedScript && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Generated Script</h3>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(`${generatedScript.hook}\n\n${generatedScript.body}\n\n${generatedScript.cta}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Copy size={12} /> Copy
                  </button>
                  <button onClick={saveScript}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <Bookmark size={12} /> Save
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Hook</p>
                  <p className="text-sm text-gray-900">{generatedScript.hook}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Body</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{generatedScript.body}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase mb-1">Call to Action</p>
                  <p className="text-sm text-gray-900">{generatedScript.cta}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hook Generator Tab */}
      {activeTab === "hooks" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Topic</label>
            <div className="flex gap-3">
              <input type="text" value={hookTopic} onChange={(e) => setHookTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateHooks()}
                placeholder="e.g., meal prep, home workouts, productivity hacks"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              <button onClick={generateHooks} disabled={generatingHooks || !hookTopic.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                {generatingHooks ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                Generate Hooks
              </button>
            </div>
          </div>

          {hookError && <ErrorMessage message={hookError} onRetry={generateHooks} />}

          {generatedHooks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Generated Hooks</h3>
              {generatedHooks.map((hook, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-gray-900 flex-1">{hook}</p>
                  <button onClick={() => copyToClipboard(hook)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Scripts Tab */}
      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedScripts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <PenTool size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No saved scripts yet</p>
              <p className="text-gray-400 text-xs mt-1">Generate a script and save it to see it here</p>
            </div>
          )}
          {savedScripts.map(script => (
            <div key={script.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{script.mode}</span>
                  <span className="text-xs text-gray-400 ml-2">{script.tone} · {script.duration}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyToClipboard(`${script.hook}\n\n${script.body}\n\n${script.cta}`)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => setSavedScripts(prev => prev.filter(s => s.id !== script.id))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-orange-600">HOOK</p>
                  <p className="text-sm text-gray-900">{script.hook}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600">BODY</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{script.body}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600">CTA</p>
                  <p className="text-sm text-gray-900">{script.cta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// SETTINGS PAGE
// ============================================================

const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Account</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" defaultValue="michael@example.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" defaultValue="Michael" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
          Save Changes
        </button>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Get notified about new outliers</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
            <p className="text-xs text-gray-500 mt-0.5">Receive weekly summary of trending content</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">API Keys</h2>
      <p className="text-xs text-gray-500 mb-3">Configure API keys in your Vercel environment variables for full functionality.</p>
      <div className="space-y-3">
        {["YOUTUBE_API_KEY", "RAPIDAPI_KEY", "ANTHROPIC_API_KEY"].map(key => (
          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-gray-400" />
              <span className="text-sm font-mono text-gray-700">{key}</span>
            </div>
            <span className="text-xs text-gray-400">Set in Vercel</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// PROJECTS PAGE (stub — step 6 will flesh out)
// ============================================================

const ProjectsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Projects</h1>
      <p className="text-sm text-gray-500 mt-1">Organize winning ideas into collections to speed up your workflow</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
      <FolderOpen size={32} className="text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700">No projects yet</p>
      <p className="text-xs text-gray-500 mt-1">Projects let you group ideas, scripts and videos for a single content initiative</p>
      <button className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
        <Plus size={14} /> New project
      </button>
    </div>
  </div>
);

// ============================================================
// EXPORTS PAGE (stub — step 6 will flesh out)
// ============================================================

const ExportsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Exports</h1>
      <p className="text-sm text-gray-500 mt-1">Download your saved videos, scripts and transcripts</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
      <Archive size={32} className="text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700">No exports yet</p>
      <p className="text-xs text-gray-500 mt-1">Scripts you export from the Scripts page will show up here</p>
    </div>
  </div>
);

// ============================================================
// PERSONA PAGE (stub — step 6 will flesh out)
// ============================================================

const PersonaPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-xl font-bold text-gray-900">Persona</h1>
      <p className="text-sm text-gray-500 mt-1">Tell us about the content you make so we can tailor ideas and scripts</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
        <input type="text" placeholder="e.g. AI tools for creators" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
        <input type="text" placeholder="e.g. solo creators and indie founders" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Voice & tone</label>
        <textarea rows={3} placeholder="e.g. casual, direct, no fluff" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topics you cover</label>
        <textarea rows={2} placeholder="e.g. AI workflows, productivity, startup stories" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
        Save persona
      </button>
    </div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================

const NAV_SECTIONS = [
  {
    title: "Research",
    items: [
      { id: "videos", label: "Videos", icon: Video },
      { id: "ideas", label: "Ideas", icon: Lightbulb },
    ]
  },
  {
    title: "Create",
    items: [
      { id: "scripts", label: "Scripts", icon: PenTool },
      { id: "projects", label: "Projects", icon: FolderOpen },
      { id: "exports", label: "Exports", icon: Archive },
    ]
  },
  {
    title: "Configure",
    items: [
      { id: "channels", label: "Channels", icon: Users },
      { id: "persona", label: "Persona", icon: UserCircle },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("videos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchlist, setWatchlist] = useState(() => loadFromStorage(STORAGE_KEYS.watchlist, SAMPLE_WATCHLIST));
  const [savedVideos, setSavedVideos] = useState(() => loadFromStorage(STORAGE_KEYS.savedVideos, []));

  // Persist to localStorage
  useEffect(() => { saveToStorage(STORAGE_KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.savedVideos, savedVideos); }, [savedVideos]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-56" : "w-16"} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col`}>
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">O</div>
          </button>
          {sidebarOpen && <span className="font-bold text-gray-900 text-sm">Optimus.AI</span>}
        </div>

        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{section.title}</h3>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                      currentPage === item.id
                        ? "bg-gray-100 text-gray-900 font-semibold"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title={item.label}>
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-3 border-t border-gray-100">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <HelpCircle size={18} /> <span>Help Center</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px]">
          {currentPage === "channels" && <ChannelsPage watchlist={watchlist} setWatchlist={setWatchlist} />}
          {currentPage === "videos" && <VideosPage watchlist={watchlist} savedVideos={savedVideos} setSavedVideos={setSavedVideos} setCurrentPage={setCurrentPage} />}
          {currentPage === "scripts" && <ScriptsPage savedVideos={savedVideos} />}
          {currentPage === "ideas" && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Ideas</h1>
                <p className="text-sm text-gray-500 mt-1">Autogenerated ideas worth making, based on your saved videos</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
                <Lightbulb size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No ideas yet</p>
                <p className="text-xs text-gray-500 mt-1">Save videos to your vault and we'll surface ideas you can run with</p>
              </div>
            </div>
          )}
          {currentPage === "projects" && <ProjectsPage />}
          {currentPage === "exports" && <ExportsPage />}
          {currentPage === "persona" && <PersonaPage />}
          {currentPage === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
