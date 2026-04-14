import { useState, useEffect } from "react";
import {
  Search, TrendingUp, Zap, BookOpen, Archive, Settings, Eye, ThumbsUp,
  MessageCircle, Clock, Star, Copy, ChevronDown, Plus, Sparkles, RefreshCw,
  X, BarChart3, Users, Video, Bookmark, Flame, ArrowRight, Lightbulb,
  PenTool, Layers, Play, Filter, Grid, List, Trash2, Download, Check,
  ChevronLeft, Share2, Code, Zap as ZapIcon, AlertCircle, Heart, Palette,
  FileText, Target, LayoutGrid, Activity, Bell, Moon, Sun, Key, Globe,
  ChevronRight, ExternalLink, Hash, Calendar, Wand2, Link, SlidersHorizontal,
  HelpCircle, Upload
} from "lucide-react";

// ============================================================
// SAMPLE DATA
// ============================================================

const SAMPLE_WATCHLIST = [
  { id: 1, name: "_macro_daddy", platform: "instagram", platformUrl: "https://instagram.com/_macro_daddy", followers: "773K", followersNum: 773000, avatar: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" },
  { id: 2, name: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/alexastancofit", followers: "409K", followersNum: 409000, avatar: "https://ui-avatars.com/api/?name=AC&background=4ECDC4&color=fff" },
  { id: 3, name: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/coachdango", followers: "1.4M", followersNum: 1400000, avatar: "https://ui-avatars.com/api/?name=CD&background=95E1D3&color=fff" },
  { id: 4, name: "danmartell", platform: "instagram", platformUrl: "https://instagram.com/danmartell", followers: "2.2M", followersNum: 2200000, avatar: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" },
  { id: 5, name: "falkefit", platform: "tiktok", platformUrl: "https://tiktok.com/@falkefit", followers: "339K", followersNum: 339000, avatar: "https://ui-avatars.com/api/?name=FF&background=AA96DA&color=fff" },
  { id: 6, name: "therealbrianmark", platform: "instagram", platformUrl: "https://instagram.com/therealbrianmark", followers: "642K", followersNum: 642000, avatar: "https://ui-avatars.com/api/?name=BM&background=FCBAD3&color=fff" },
  { id: 7, name: "devinfitofficial", platform: "instagram", platformUrl: "https://instagram.com/devinfitofficial", followers: "639K", followersNum: 639000, avatar: "https://ui-avatars.com/api/?name=DF&background=A8D8EA&color=fff" },
  { id: 8, name: "kelseypoulter", platform: "youtube", platformUrl: "https://youtube.com/@kelseypoulter", followers: "993K", followersNum: 993000, avatar: "https://ui-avatars.com/api/?name=KP&background=FF9FF3&color=fff" },
];

const SAMPLE_SUGGESTIONS = [
  { id: 101, name: "thedolcediet", platform: "instagram", platformUrl: "https://instagram.com/thedolcediet", followers: "247K", followersNum: 247000, avatar: "https://ui-avatars.com/api/?name=TD&background=A8E6CF&color=fff" },
  { id: 102, name: "jonmango", platform: "tiktok", platformUrl: "https://tiktok.com/@jonmango", followers: "36K", followersNum: 36000, avatar: "https://ui-avatars.com/api/?name=JM&background=FFD3B6&color=fff" },
  { id: 103, name: "vladimirfitness", platform: "youtube", platformUrl: "https://youtube.com/@vladimirfitness", followers: "9.4M", followersNum: 9400000, avatar: "https://ui-avatars.com/api/?name=VF&background=FFAAA5&color=fff" },
  { id: 104, name: "fitnessblender", platform: "youtube", platformUrl: "https://youtube.com/@fitnessblender", followers: "6.6M", followersNum: 6600000, avatar: "https://ui-avatars.com/api/?name=FB&background=FF8B94&color=fff" },
  { id: 105, name: "saschafitness", platform: "instagram", platformUrl: "https://instagram.com/saschafitness", followers: "5.8M", followersNum: 5800000, avatar: "https://ui-avatars.com/api/?name=SF&background=A8D8EA&color=fff" },
  { id: 106, name: "jordanyeohfitness", platform: "instagram", platformUrl: "https://instagram.com/jordanyeohfitness", followers: "4.5M", followersNum: 4500000, avatar: "https://ui-avatars.com/api/?name=JY&background=AA96DA&color=fff" },
  { id: 107, name: "_aussiefitness", platform: "instagram", platformUrl: "https://instagram.com/_aussiefitness", followers: "3.2M", followersNum: 3200000, avatar: "https://ui-avatars.com/api/?name=AF&background=FCBAD3&color=fff" },
  { id: 108, name: "marpefitness_", platform: "instagram", platformUrl: "https://instagram.com/marpefitness_", followers: "2.5M", followersNum: 2500000, avatar: "https://ui-avatars.com/api/?name=MF&background=F0A500&color=fff" },
  { id: 109, name: "littlefitness", platform: "instagram", platformUrl: "https://instagram.com/littlefitness", followers: "2.5M", followersNum: 2500000, avatar: "https://ui-avatars.com/api/?name=LF&background=4ECDC4&color=fff" },
  { id: 110, name: "thefitnesschef_", platform: "instagram", platformUrl: "https://instagram.com/thefitnesschef_", followers: "2.3M", followersNum: 2300000, avatar: "https://ui-avatars.com/api/?name=TFC&background=FF6B6B&color=fff" },
  { id: 111, name: "scaseyfitness", platform: "instagram", platformUrl: "https://instagram.com/scaseyfitness", followers: "2.2M", followersNum: 2200000, avatar: "https://ui-avatars.com/api/?name=SC&background=95E1D3&color=fff" },
  { id: 112, name: "fitnessfaqs", platform: "youtube", platformUrl: "https://youtube.com/@fitnessfaqs", followers: "2.2M", followersNum: 2200000, avatar: "https://ui-avatars.com/api/?name=FF&background=A8D8EA&color=fff" },
  { id: 113, name: "jeffnippardfitness", platform: "youtube", platformUrl: "https://youtube.com/@jeffnippardfitness", followers: "2.2M", followersNum: 2200000, avatar: "https://ui-avatars.com/api/?name=JN&background=AA96DA&color=fff" },
  { id: 114, name: "fitnessbymaddy_", platform: "instagram", platformUrl: "https://instagram.com/fitnessbymaddy_", followers: "2.1M", followersNum: 2100000, avatar: "https://ui-avatars.com/api/?name=FM&background=FCBAD3&color=fff" },
  { id: 115, name: "ericjanickifitness", platform: "instagram", platformUrl: "https://instagram.com/ericjanickifitness", followers: "2M", followersNum: 2000000, avatar: "https://ui-avatars.com/api/?name=EJ&background=FFD3B6&color=fff" },
  { id: 116, name: "ulrich_fitness", platform: "tiktok", platformUrl: "https://tiktok.com/@ulrich_fitness", followers: "1.9M", followersNum: 1900000, avatar: "https://ui-avatars.com/api/?name=UF&background=FFAAA5&color=fff" },
];

const SAMPLE_VIDEOS = [
  { id: 1, title: "Low calorie protein swaps you need to try", creator: "_macro_daddy", platform: "instagram", platformUrl: "https://instagram.com/reel/example1", thumbnail: "https://picsum.photos/seed/v1/270/480", outlier: 1.3, views: "18K", engagement: "4%", postedAgo: "1d ago", outlierScore: 13, viewsNum: 18000, engagementNum: 4 },
  { id: 2, title: "Have you ever heard of this fitness hack?", creator: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/reel/example2", thumbnail: "https://picsum.photos/seed/v2/270/480", outlier: 1.0, views: "13K", engagement: "4%", postedAgo: "1d ago", outlierScore: 10, viewsNum: 13000, engagementNum: 4 },
  { id: 3, title: "Transform your body with this trick", creator: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/reel/example3", thumbnail: "https://picsum.photos/seed/v3/270/480", outlier: 1.5, views: "25K", engagement: "6%", postedAgo: "2d ago", outlierScore: 15, viewsNum: 25000, engagementNum: 6 },
  { id: 4, title: "Fitness myths debunked in 60 seconds", creator: "danmartell", platform: "youtube", platformUrl: "https://youtube.com/shorts/example4", thumbnail: "https://picsum.photos/seed/v4/270/480", outlier: 2.1, views: "42K", engagement: "8%", postedAgo: "3d ago", outlierScore: 21, viewsNum: 42000, engagementNum: 8 },
  { id: 5, title: "This changed my workout routine forever", creator: "falkefit", platform: "tiktok", platformUrl: "https://tiktok.com/@falkefit/video/example5", thumbnail: "https://picsum.photos/seed/v5/270/480", outlier: 1.2, views: "19K", engagement: "5%", postedAgo: "1d ago", outlierScore: 12, viewsNum: 19000, engagementNum: 5 },
  { id: 6, title: "The #1 mistake people make at the gym", creator: "therealbrianmark", platform: "instagram", platformUrl: "https://instagram.com/reel/example6", thumbnail: "https://picsum.photos/seed/v6/270/480", outlier: 1.8, views: "35K", engagement: "7%", postedAgo: "2d ago", outlierScore: 18, viewsNum: 35000, engagementNum: 7 },
  { id: 7, title: "Quick abs workout for busy people", creator: "devinfitofficial", platform: "instagram", platformUrl: "https://instagram.com/reel/example7", thumbnail: "https://picsum.photos/seed/v7/270/480", outlier: 1.4, views: "22K", engagement: "6%", postedAgo: "1d ago", outlierScore: 14, viewsNum: 22000, engagementNum: 6 },
  { id: 8, title: "Nutrition secrets from pro athletes", creator: "kelseypoulter", platform: "youtube", platformUrl: "https://youtube.com/shorts/example8", thumbnail: "https://picsum.photos/seed/v8/270/480", outlier: 1.6, views: "28K", engagement: "7%", postedAgo: "2d ago", outlierScore: 16, viewsNum: 28000, engagementNum: 7 },
  { id: 9, title: "5 minute morning energy boost", creator: "_macro_daddy", platform: "youtube", platformUrl: "https://youtube.com/shorts/example9", thumbnail: "https://picsum.photos/seed/v9/270/480", outlier: 0.9, views: "11K", engagement: "3%", postedAgo: "3d ago", outlierScore: 9, viewsNum: 11000, engagementNum: 3 },
  { id: 10, title: "How I get shredded without starving", creator: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/reel/example10", thumbnail: "https://picsum.photos/seed/v10/270/480", outlier: 2.0, views: "38K", engagement: "8%", postedAgo: "1d ago", outlierScore: 20, viewsNum: 38000, engagementNum: 8 },
  { id: 11, title: "Mobility routine that actually works", creator: "coachdango", platform: "tiktok", platformUrl: "https://tiktok.com/@coachdango/video/example11", thumbnail: "https://picsum.photos/seed/v11/270/480", outlier: 1.1, views: "16K", engagement: "4%", postedAgo: "2d ago", outlierScore: 11, viewsNum: 16000, engagementNum: 4 },
  { id: 12, title: "Meal prep for the entire week", creator: "danmartell", platform: "instagram", platformUrl: "https://instagram.com/reel/example12", thumbnail: "https://picsum.photos/seed/v12/270/480", outlier: 1.7, views: "32K", engagement: "6%", postedAgo: "3d ago", outlierScore: 17, viewsNum: 32000, engagementNum: 6 },
  { id: 13, title: "Why you're not getting stronger", creator: "falkefit", platform: "youtube", platformUrl: "https://youtube.com/shorts/example13", thumbnail: "https://picsum.photos/seed/v13/270/480", outlier: 1.4, views: "24K", engagement: "5%", postedAgo: "1d ago", outlierScore: 14, viewsNum: 24000, engagementNum: 5 },
  { id: 14, title: "Recovery tips from elite trainers", creator: "therealbrianmark", platform: "tiktok", platformUrl: "https://tiktok.com/@therealbrianmark/video/example14", thumbnail: "https://picsum.photos/seed/v14/270/480", outlier: 1.3, views: "20K", engagement: "5%", postedAgo: "2d ago", outlierScore: 13, viewsNum: 20000, engagementNum: 5 },
  { id: 15, title: "Cardio myths that need to die", creator: "devinfitofficial", platform: "youtube", platformUrl: "https://youtube.com/shorts/example15", thumbnail: "https://picsum.photos/seed/v15/270/480", outlier: 1.9, views: "36K", engagement: "7%", postedAgo: "1d ago", outlierScore: 19, viewsNum: 36000, engagementNum: 7 },
  { id: 16, title: "How to build muscle in 30 days", creator: "kelseypoulter", platform: "instagram", platformUrl: "https://instagram.com/reel/example16", thumbnail: "https://picsum.photos/seed/v16/270/480", outlier: 2.2, views: "45K", engagement: "9%", postedAgo: "2d ago", outlierScore: 22, viewsNum: 45000, engagementNum: 9 },
  { id: 17, title: "Stretching routine for flexibility", creator: "_macro_daddy", platform: "instagram", platformUrl: "https://instagram.com/reel/example17", thumbnail: "https://picsum.photos/seed/v17/270/480", outlier: 1.0, views: "14K", engagement: "4%", postedAgo: "3d ago", outlierScore: 10, viewsNum: 14000, engagementNum: 4 },
  { id: 18, title: "The best home workout equipment", creator: "alexastancofit", platform: "youtube", platformUrl: "https://youtube.com/shorts/example18", thumbnail: "https://picsum.photos/seed/v18/270/480", outlier: 1.5, views: "26K", engagement: "6%", postedAgo: "1d ago", outlierScore: 15, viewsNum: 26000, engagementNum: 6 },
  { id: 19, title: "Post-workout meal ideas", creator: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/reel/example19", thumbnail: "https://picsum.photos/seed/v19/270/480", outlier: 1.2, views: "17K", engagement: "5%", postedAgo: "2d ago", outlierScore: 12, viewsNum: 17000, engagementNum: 5 },
  { id: 20, title: "Sleep optimization for gains", creator: "danmartell", platform: "tiktok", platformUrl: "https://tiktok.com/@danmartell/video/example20", thumbnail: "https://picsum.photos/seed/v20/270/480", outlier: 1.6, views: "29K", engagement: "6%", postedAgo: "3d ago", outlierScore: 16, viewsNum: 29000, engagementNum: 6 },
];

const SAMPLE_HOOKS = [
  { id: 1, type: "hook", content: "What if I told you that everything you know about [topic] is wrong?", source: "Ryan Trahan", views: "2.1M", tags: ["question", "curiosity gap"] },
  { id: 2, type: "hook", content: "I spent $10,000 testing this so you don't have to.", source: "Mark Tilbury", views: "890K", tags: ["story", "investment"] },
  { id: 3, type: "hook", content: "Nobody ever talks about this but...", source: "Ali Abdaal", views: "1.5M", tags: ["insight", "hidden"] },
];

const SAMPLE_STYLES = [
  { id: 4, type: "style", content: "Fast-paced cuts with text overlays, jump cuts every 2-3 seconds, high energy voiceover", source: "Ali Abdaal", tags: ["editing", "pacing"] },
  { id: 5, type: "style", content: "Slow intro, build tension, shocking reveal, immediate payoff", source: "Ryan Trahan", tags: ["narrative", "tension"] },
];

const SAMPLE_STRUCTURES = [
  { id: 6, type: "structure", content: "Hook (3s) → Context (5s) → 3 Key Points (20s) → Twist (5s) → CTA (3s)", source: "Jade Bowler", tags: ["framework", "short-form"] },
];

// Platform icon helper
const PlatformIcon = ({ platform, size = 20 }) => {
  const colors = { instagram: "#E1306C", tiktok: "#000000", youtube: "#FF0000" };
  const labels = { instagram: "IG", tiktok: "TT", youtube: "YT" };
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: colors[platform] || "#999",
      color: "white", fontSize: size * 0.42, fontWeight: 700,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0
    }}>
      {labels[platform] || "?"}
    </span>
  );
};

// Platform badge for video cards (top-right corner)
const PlatformBadge = ({ platform }) => {
  const names = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube Shorts" };
  const colors = { instagram: "#E1306C", tiktok: "#000000", youtube: "#FF0000" };
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold" style={{
      backgroundColor: "rgba(255,255,255,0.9)",
      color: colors[platform] || "#666",
      backdropFilter: "blur(4px)"
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        backgroundColor: colors[platform] || "#999",
        display: "inline-flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "white", fontSize: 7, fontWeight: 700 }}>
          {platform === "instagram" ? "IG" : platform === "tiktok" ? "TT" : "YT"}
        </span>
      </span>
      {names[platform] || platform}
    </div>
  );
};

const OutlierBadge = ({ score }) => {
  if (!score) return null;
  const x = typeof score === "number" ? score : parseFloat(score);
  const color = x >= 2 ? "text-orange-600" : x >= 1.5 ? "text-amber-600" : "text-gray-500";
  return (
    <span className={`text-xs font-semibold ${color} flex items-center gap-0.5`}>
      <TrendingUp size={10} />
      {(x / 10).toFixed(1)}x
    </span>
  );
};

// ============================================================
// CHANNELS PAGE (Sandcastles-matching: Suggestions/Watchlist tabs)
// ============================================================

const ChannelsPage = ({ watchlist, setWatchlist }) => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [handleSearch, setHandleSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountSizeFilter, setAccountSizeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState(SAMPLE_SUGGESTIONS);
  const [showPlatformDrop, setShowPlatformDrop] = useState(false);
  const [showSizeDrop, setShowSizeDrop] = useState(false);

  const parseFollowers = (str) => {
    if (!str) return 0;
    const s = str.replace(/,/g, "");
    if (s.includes("M")) return parseFloat(s) * 1000000;
    if (s.includes("K")) return parseFloat(s) * 1000;
    return parseInt(s) || 0;
  };

  const filterBySize = (creator) => {
    if (accountSizeFilter === "all") return true;
    const num = creator.followersNum || parseFollowers(creator.followers);
    if (accountSizeFilter === "large") return num >= 1000000;
    if (accountSizeFilter === "medium") return num >= 100000 && num < 1000000;
    if (accountSizeFilter === "small") return num < 100000;
    return true;
  };

  const filterCreator = (creator) => {
    if (platformFilter !== "all" && creator.platform !== platformFilter) return false;
    if (!filterBySize(creator)) return false;
    const q = (searchQuery + " " + handleSearch).trim().toLowerCase();
    if (q && !creator.name.toLowerCase().includes(q)) return false;
    return true;
  };

  const filteredSuggestions = suggestions.filter(filterCreator);
  const filteredWatchlist = watchlist.filter(filterCreator);

  const addToWatchlist = (creator) => {
    setWatchlist(prev => [...prev, creator]);
    setSuggestions(prev => prev.filter(s => s.id !== creator.id));
  };

  const removeFromWatchlist = (creatorId) => {
    const removed = watchlist.find(w => w.id === creatorId);
    if (removed) {
      setWatchlist(prev => prev.filter(w => w.id !== creatorId));
      setSuggestions(prev => [...prev, removed]);
    }
  };

  const platformLabel = { all: "Platform", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };
  const sizeLabel = { all: "Account size", large: "Large (1M+)", medium: "Medium (100K-1M)", small: "Small (<100K)" };

  const displayList = activeTab === "suggestions" ? filteredSuggestions : filteredWatchlist;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Channels</h2>
        <p className="text-sm text-gray-500 mt-1">Pick which channels to include in your videos feed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {["suggestions", "watchlist"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "suggestions" ? "Suggestions" : "Watchlist"}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Describe your content, or find a channel by handle"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
          <input
            type="text"
            placeholder="Search for a channel by handle"
            value={handleSearch}
            onChange={(e) => setHandleSearch(e.target.value)}
            className="w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />

          {/* Platform Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowPlatformDrop(!showPlatformDrop); setShowSizeDrop(false); }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
            >
              {platformLabel[platformFilter]}
              <ChevronDown size={14} />
            </button>
            {showPlatformDrop && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowPlatformDrop(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-40">
                  {Object.entries(platformLabel).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setPlatformFilter(val); setShowPlatformDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm ${platformFilter === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Account Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowSizeDrop(!showSizeDrop); setShowPlatformDrop(false); }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
            >
              {sizeLabel[accountSizeFilter]}
              <ChevronDown size={14} />
            </button>
            {showSizeDrop && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSizeDrop(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-48">
                  {Object.entries(sizeLabel).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setAccountSizeFilter(val); setShowSizeDrop(false); }}
                      className={`w-full text-left px-3 py-2 text-sm ${accountSizeFilter === val ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => { /* Filters apply in real-time */ }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Watchlist sidebar header (shown in suggestions tab) or Watchlist content */}
      {activeTab === "suggestions" ? (
        <div className="flex gap-6">
          {/* Suggestions Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSuggestions.map(creator => (
                <div key={creator.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-blue-300 transition-all group">
                  <div className="relative flex-shrink-0">
                    <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full" />
                    <div className="absolute -bottom-1 -right-1">
                      <PlatformIcon platform={creator.platform} size={18} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={creator.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block transition-colors">
                      {creator.name}
                    </a>
                    <p className="text-xs text-gray-500">{creator.followers} followers</p>
                  </div>
                  <button
                    onClick={() => addToWatchlist(creator)}
                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Add to Watchlist"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
            {filteredSuggestions.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">No suggestions found matching your filters.</div>
            )}
          </div>

          {/* Right Sidebar - Your Watchlist */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Your Watchlist</h3>
                <span className="text-xs text-gray-400">{watchlist.length} / 100</span>
              </div>
              <button className="w-full mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                Save
              </button>
              <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
                {watchlist.map(creator => (
                  <div key={creator.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="relative flex-shrink-0">
                      <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full" />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <PlatformIcon platform={creator.platform} size={14} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={creator.platformUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-900 hover:text-blue-600 truncate block transition-colors">
                        {creator.name}
                      </a>
                      <p className="text-xs text-gray-400">{creator.followers}</p>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(creator.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Watchlist Tab - Full width list */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Your Watchlist</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{watchlist.length} / 100 channels</span>
              <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
                Save
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWatchlist.map(creator => (
              <div key={creator.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 group hover:border-gray-300 transition-all">
                <div className="relative flex-shrink-0">
                  <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full" />
                  <div className="absolute -bottom-1 -right-1">
                    <PlatformIcon platform={creator.platform} size={18} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <a href={creator.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block transition-colors">
                    {creator.name}
                  </a>
                  <p className="text-xs text-gray-500">{creator.followers} followers</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => window.open(creator.platformUrl, "_blank")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(creator.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredWatchlist.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No channels in your watchlist match the current filters.</div>
          )}
          {watchlist.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  watchlist.forEach(c => setSuggestions(prev => [...prev, c]));
                  setWatchlist([]);
                }}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Remove all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// VIDEOS PAGE (Sandcastles-matching: toggleable filter sidebar)
// ============================================================

const VideosPage = ({ watchlist, savedVideos, setSavedVideos, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState("all");
  const [outlierMin, setOutlierMin] = useState("");
  const [outlierMax, setOutlierMax] = useState("");
  const [viewsMin, setViewsMin] = useState("");
  const [viewsMax, setViewsMax] = useState("");
  const [engagementMin, setEngagementMin] = useState("");
  const [engagementMax, setEngagementMax] = useState("");
  const [postedInLast, setPostedInLast] = useState("");
  const [postedInLastUnit, setPostedInLastUnit] = useState("Months");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [keywords, setKeywords] = useState("");
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const feedVideos = SAMPLE_VIDEOS.filter(v =>
    watchlist.some(w => w.name === v.creator)
  );

  const filteredVideos = (activeTab === "feed" ? feedVideos : savedVideos).filter(v => {
    if (outlierMin && v.outlierScore < parseFloat(outlierMin)) return false;
    if (outlierMax && v.outlierScore > parseFloat(outlierMax)) return false;
    if (viewsMin && v.viewsNum < parseInt(viewsMin)) return false;
    if (viewsMax && v.viewsNum > parseInt(viewsMax)) return false;
    if (engagementMin && v.engagementNum < parseFloat(engagementMin)) return false;
    if (engagementMax && v.engagementNum > parseFloat(engagementMax)) return false;
    if (channelFilter !== "all" && v.creator !== channelFilter) return false;
    if (platformFilter !== "all" && v.platform !== platformFilter) return false;
    if (keywords && !v.title.toLowerCase().includes(keywords.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "outlier") return b.outlierScore - a.outlierScore;
    if (sortBy === "views") return b.viewsNum - a.viewsNum;
    if (sortBy === "engagement") return (b.engagementNum || 0) - (a.engagementNum || 0);
    return 0; // newest = default order
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
    setChannelFilter("all"); setPlatformFilter("all");
    setKeywords(""); setPostedInLast("");
  };

  const platformLabel = { all: "All platforms", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Videos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === "feed" ? "Save high-performing videos to your vault to unlock deep analysis" : "Videos you've saved to your vault"}
        </p>
      </div>

      {/* Tabs + Toolbar Row */}
      <div className="flex items-center justify-between mb-5">
        {/* Left: Tabs */}
        <div className="flex gap-2">
          {["feed", "vault"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "feed" ? "Feed" : "Vault"}
            </button>
          ))}
        </div>

        {/* Right: Toolbar buttons */}
        <div className="flex items-center gap-3">
          {activeTab === "feed" && (
            <button
              onClick={() => setCurrentPage("channels")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={14} />
              Configure channels
            </button>
          )}
          {activeTab === "vault" && (
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Plus size={14} />
              Add video URL
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
              showFilters ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Filter size={14} />
            Filter
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BarChart3 size={14} />
              Sort by
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 w-44">
                  {[
                    { key: "newest", label: "Newest" },
                    { key: "outlier", label: "Outlier score" },
                    { key: "views", label: "Views" },
                    { key: "engagement", label: "Engagement rate" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === opt.key ? "text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Filter Sidebar + Video Grid */}
      <div className="flex gap-5">
        {/* Filter Sidebar (toggleable) */}
        {showFilters && (
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
              </div>

              <div className="space-y-4">
                {/* Saved Filters */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Saved Filters</label>
                  <button className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-between">
                    <span>Pick one to apply</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Channels Dropdown */}
                <div className="relative">
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Channels</label>
                  <button
                    onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors flex items-center justify-between"
                  >
                    <span className={channelFilter === "all" ? "text-gray-400" : "text-gray-900"}>
                      {channelFilter === "all" ? "All channels" : channelFilter}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {showChannelDropdown && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowChannelDropdown(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
                        <button
                          onClick={() => { setChannelFilter("all"); setShowChannelDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${channelFilter === "all" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          All channels
                        </button>
                        {watchlist.map(creator => (
                          <button
                            key={creator.id}
                            onClick={() => { setChannelFilter(creator.name); setShowChannelDropdown(false); }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              channelFilter === creator.name ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <img src={creator.avatar} alt="" className="w-5 h-5 rounded-full" />
                            <span className="truncate">{creator.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Outlier Score */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Outlier score</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="0x" value={outlierMin} onChange={(e) => setOutlierMin(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                    <input type="text" placeholder="100x" value={outlierMax} onChange={(e) => setOutlierMax(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                  </div>
                </div>

                {/* Views */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Views</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="0" value={viewsMin} onChange={(e) => setViewsMin(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                    <input type="text" placeholder="10,000,000" value={viewsMax} onChange={(e) => setViewsMax(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                  </div>
                </div>

                {/* Engagement */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Engagement</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="0%" value={engagementMin} onChange={(e) => setEngagementMin(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                    <input type="text" placeholder="100%" value={engagementMax} onChange={(e) => setEngagementMax(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                  </div>
                </div>

                {/* Posted in last */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 font-medium">Posted in last</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="0" value={postedInLast} onChange={(e) => setPostedInLast(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                    <div className="relative">
                      <button
                        onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:border-gray-300 flex items-center gap-1"
                      >
                        {postedInLastUnit}
                        <ChevronDown size={10} />
                      </button>
                      {showUnitDropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowUnitDropdown(false)} />
                          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-24">
                            {["Days", "Weeks", "Months"].map(u => (
                              <button key={u} onClick={() => { setPostedInLastUnit(u); setShowUnitDropdown(false); }}
                                className={`w-full text-left px-3 py-1.5 text-xs ${postedInLastUnit === u ? "text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                                {u}
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
                  <button
                    onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors flex items-center justify-between"
                  >
                    <span className={platformFilter === "all" ? "text-gray-400" : "text-gray-900"}>
                      {platformLabel[platformFilter]}
                    </span>
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
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white" />
                </div>

                <button className="w-full px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Save filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1">
          <div className={`grid gap-4 ${showFilters ? "grid-cols-3 xl:grid-cols-4" : "grid-cols-4 xl:grid-cols-5"}`}>
            {filteredVideos.map(video => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredVideoId(video.id)}
                onMouseLeave={() => setHoveredVideoId(null)}
              >
                {/* 9:16 Thumbnail */}
                <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-2" style={{ paddingBottom: "177.78%" }}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Platform Badge */}
                  <PlatformBadge platform={video.platform} />

                  {/* Save to vault button */}
                  <div className={`absolute top-2 right-2 transition-opacity ${hoveredVideoId === video.id || isInVault(video.id) ? "opacity-100" : "opacity-0"}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); isInVault(video.id) ? removeFromVault(video.id) : saveToVault(video); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isInVault(video.id)
                          ? "bg-blue-500 text-white"
                          : "bg-white/90 text-gray-700 hover:bg-white backdrop-blur"
                      }`}
                    >
                      {isInVault(video.id) ? "Saved" : "Save to vault"}
                    </button>
                  </div>
                </div>

                {/* Video Info */}
                <div>
                  <a
                    href={video.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors block leading-snug"
                  >
                    {video.title}
                  </a>

                  <p className="text-xs text-gray-400 mt-1">
                    @{video.creator}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{video.postedAgo}</span>
                    {video.outlier >= 1.0 && (
                      <span className="text-orange-500 font-semibold flex items-center gap-0.5">
                        <TrendingUp size={10} />
                        {video.outlier}x
                      </span>
                    )}
                    <span>{video.views}</span>
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

          {filteredVideos.length > 0 && (
            <div className="text-center mt-8">
              <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SCRIPTS PAGE
// ============================================================

const ScriptsPage = ({ vaultItems, scriptsWritten, setScriptsWritten }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredItems = vaultItems.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchTerm && !item.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scripts</h1>
        <p className="text-sm text-gray-500 mt-1">Generate viral video scripts from your saved content</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Scripts Written", value: scriptsWritten, gradient: "from-purple-400 to-pink-500" },
          { label: "Hooks Saved", value: vaultItems.filter(i => i.type === "hook").length, gradient: "from-blue-400 to-cyan-500" },
          { label: "Styles Saved", value: vaultItems.filter(i => i.type === "style").length, gradient: "from-orange-400 to-pink-500" },
          { label: "Structures Saved", value: vaultItems.filter(i => i.type === "structure").length, gradient: "from-green-400 to-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} mb-2`} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setScriptsWritten(scriptsWritten + 1)}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition-shadow"
      >
        Write New Script
      </button>

      <div className="flex gap-4 mb-6">
        <input
          type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        <select
          value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="hook">Hooks</option>
          <option value="style">Styles</option>
          <option value="structure">Structures</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                item.type === "hook" ? "bg-blue-500" : item.type === "style" ? "bg-orange-500" : "bg-green-500"
              }`}>
                {item.type === "hook" ? "H" : item.type === "style" ? "S" : "St"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">{item.type}</span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{item.content}</p>
                <p className="text-xs text-gray-400">Source: {item.source}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500 font-medium">{item.views}</p>
                <div className="flex gap-1 mt-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS PAGE
// ============================================================

const SettingsPage = () => {
  return (
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
    </div>
  );
};

// ============================================================
// MAIN APP (Sandcastles-matching navigation)
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
    ]
  },
  {
    title: "Configure",
    items: [
      { id: "channels", label: "Channels", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

export default function App() {
  const [currentPage, setCurrentPage] = useState("videos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchlist, setWatchlist] = useState(SAMPLE_WATCHLIST);
  const [savedVideos, setSavedVideos] = useState([]);
  const [scriptsWritten, setScriptsWritten] = useState(0);

  const vaultItems = [...SAMPLE_HOOKS, ...SAMPLE_STYLES, ...SAMPLE_STRUCTURES];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-56" : "w-16"} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              O
            </div>
          </button>
          {sidebarOpen && <span className="font-bold text-gray-900 text-sm">Optimus.AI</span>}
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{section.title}</h3>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                      currentPage === item.id
                        ? "bg-gray-100 text-gray-900 font-semibold"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title={item.label}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Help / Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-gray-100">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <HelpCircle size={18} />
              <span>Help Center</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Page Content */}
        <div className="p-8 max-w-[1400px]">
          {currentPage === "channels" && <ChannelsPage watchlist={watchlist} setWatchlist={setWatchlist} />}
          {currentPage === "videos" && <VideosPage watchlist={watchlist} savedVideos={savedVideos} setSavedVideos={setSavedVideos} setCurrentPage={setCurrentPage} />}
          {currentPage === "scripts" && <ScriptsPage vaultItems={vaultItems} scriptsWritten={scriptsWritten} setScriptsWritten={setScriptsWritten} />}
          {currentPage === "ideas" && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Ideas</h1>
              <p className="text-sm text-gray-500">Ideas page coming soon</p>
            </div>
          )}
          {currentPage === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
