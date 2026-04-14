import { useState, useEffect } from "react";
import {
  Search, TrendingUp, Zap, BookOpen, Archive, Settings, Eye, ThumbsUp,
  MessageCircle, Clock, Star, Copy, ChevronDown, Plus, Sparkles, RefreshCw,
  X, BarChart3, Users, Video, Bookmark, Flame, ArrowRight, Lightbulb,
  PenTool, Layers, Play, Filter, Grid, List, Trash2, Download, Check,
  ChevronLeft, Share2, Code, Zap as ZapIcon, AlertCircle, Heart, Palette,
  FileText, Target, LayoutGrid, Activity, Bell, Moon, Sun, Key, Globe,
  ChevronRight, ExternalLink, Hash, Calendar, Wand2
} from "lucide-react";

// ============================================================
// SAMPLE DATA
// ============================================================

// Flat watchlist of creators
const SAMPLE_WATCHLIST = [
  { id: 1, name: "_macro_daddy", platform: "instagram", platformUrl: "https://instagram.com/_macro_daddy", followers: "773K", avatar: "https://ui-avatars.com/api/?name=MD&background=FF6B6B&color=fff" },
  { id: 2, name: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/alexastancofit", followers: "409K", avatar: "https://ui-avatars.com/api/?name=AC&background=4ECDC4&color=fff" },
  { id: 3, name: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/coachdango", followers: "1.4M", avatar: "https://ui-avatars.com/api/?name=CD&background=95E1D3&color=fff" },
  { id: 4, name: "danmartell", platform: "instagram", platformUrl: "https://instagram.com/danmartell", followers: "2.2M", avatar: "https://ui-avatars.com/api/?name=DM&background=F38181&color=fff" },
  { id: 5, name: "falkefit", platform: "tiktok", platformUrl: "https://tiktok.com/@falkefit", followers: "339K", avatar: "https://ui-avatars.com/api/?name=FF&background=AA96DA&color=fff" },
  { id: 6, name: "therealbrianmark", platform: "instagram", platformUrl: "https://instagram.com/therealbrianmark", followers: "642K", avatar: "https://ui-avatars.com/api/?name=BM&background=FCBAD3&color=fff" },
  { id: 7, name: "devinfitofficial", platform: "instagram", platformUrl: "https://instagram.com/devinfitofficial", followers: "639K", avatar: "https://ui-avatars.com/api/?name=DF&background=A8D8EA&color=fff" },
  { id: 8, name: "kelseypoulter", platform: "youtube", platformUrl: "https://youtube.com/@kelseypoulter", followers: "993K", avatar: "https://ui-avatars.com/api/?name=KP&background=FF9FF3&color=fff" },
];

// Suggestions (creators NOT in watchlist)
const SAMPLE_SUGGESTIONS = [
  { id: 101, name: "thedolcediet", platform: "instagram", platformUrl: "https://instagram.com/thedolcediet", followers: "247K", avatar: "https://ui-avatars.com/api/?name=TD&background=A8E6CF&color=fff" },
  { id: 102, name: "jonmango", platform: "tiktok", platformUrl: "https://tiktok.com/@jonmango", followers: "36K", avatar: "https://ui-avatars.com/api/?name=JM&background=FFD3B6&color=fff" },
  { id: 103, name: "vladimirfitness", platform: "youtube", platformUrl: "https://youtube.com/@vladimirfitness", followers: "9.4M", avatar: "https://ui-avatars.com/api/?name=VF&background=FFAAA5&color=fff" },
  { id: 104, name: "fitnessblender", platform: "youtube", platformUrl: "https://youtube.com/@fitnessblender", followers: "6.6M", avatar: "https://ui-avatars.com/api/?name=FB&background=FF8B94&color=fff" },
  { id: 105, name: "saschafitness", platform: "instagram", platformUrl: "https://instagram.com/saschafitness", followers: "5.8M", avatar: "https://ui-avatars.com/api/?name=SF&background=A8D8EA&color=fff" },
  { id: 106, name: "jordanyeohfitness", platform: "instagram", platformUrl: "https://instagram.com/jordanyeohfitness", followers: "4.5M", avatar: "https://ui-avatars.com/api/?name=JY&background=AA96DA&color=fff" },
  { id: 107, name: "_aussiefitness", platform: "instagram", platformUrl: "https://instagram.com/_aussiefitness", followers: "3.2M", avatar: "https://ui-avatars.com/api/?name=AF&background=FCBAD3&color=fff" },
  { id: 108, name: "marpefitness_", platform: "instagram", platformUrl: "https://instagram.com/marpefitness_", followers: "2.5M", avatar: "https://ui-avatars.com/api/?name=MF&background=F0A500&color=fff" },
  { id: 109, name: "littlefitness", platform: "instagram", platformUrl: "https://instagram.com/littlefitness", followers: "2.5M", avatar: "https://ui-avatars.com/api/?name=LF&background=4ECDC4&color=fff" },
  { id: 110, name: "thefitnesschef_", platform: "instagram", platformUrl: "https://instagram.com/thefitnesschef_", followers: "2.3M", avatar: "https://ui-avatars.com/api/?name=TFC&background=FF6B6B&color=fff" },
  { id: 111, name: "scaseyfitness", platform: "instagram", platformUrl: "https://instagram.com/scaseyfitness", followers: "2.2M", avatar: "https://ui-avatars.com/api/?name=SC&background=95E1D3&color=fff" },
  { id: 112, name: "fitnessfaqs", platform: "youtube", platformUrl: "https://youtube.com/@fitnessfaqs", followers: "2.2M", avatar: "https://ui-avatars.com/api/?name=FF&background=A8D8EA&color=fff" },
  { id: 113, name: "jeffnippardfitness", platform: "youtube", platformUrl: "https://youtube.com/@jeffnippardfitness", followers: "2.2M", avatar: "https://ui-avatars.com/api/?name=JN&background=AA96DA&color=fff" },
  { id: 114, name: "fitnessbymaddy_", platform: "instagram", platformUrl: "https://instagram.com/fitnessbymaddy_", followers: "2.1M", avatar: "https://ui-avatars.com/api/?name=FM&background=FCBAD3&color=fff" },
  { id: 115, name: "ericjanickifitness", platform: "instagram", platformUrl: "https://instagram.com/ericjanickifitness", followers: "2M", avatar: "https://ui-avatars.com/api/?name=EJ&background=FFD3B6&color=fff" },
  { id: 116, name: "ulrich_fitness", platform: "tiktok", platformUrl: "https://tiktok.com/@ulrich_fitness", followers: "1.9M", avatar: "https://ui-avatars.com/api/?name=UF&background=FFAAA5&color=fff" },
];

// Videos from watchlist creators (mix of platforms)
const SAMPLE_VIDEOS = [
  { id: 1, title: "Low calorie protein swaps you need to try", creator: "_macro_daddy", platform: "youtube", platformUrl: "https://youtube.com/shorts/example1", thumbnail: "https://picsum.photos/seed/v1/270/480", outlier: 1.3, views: "18K", engagement: "4%", postedAgo: "1d ago", outlierScore: 13, viewsNum: 18000, engagement: 4 },
  { id: 2, title: "Have you ever heard of this fitness hack?", creator: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/reel/example2", thumbnail: "https://picsum.photos/seed/v2/270/480", outlier: 1.0, views: "13K", engagement: "4%", postedAgo: "1d ago", outlierScore: 10, viewsNum: 13000 },
  { id: 3, title: "Transform your body with this trick", creator: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/reel/example3", thumbnail: "https://picsum.photos/seed/v3/270/480", outlier: 1.5, views: "25K", engagement: "6%", postedAgo: "2d ago", outlierScore: 15, viewsNum: 25000 },
  { id: 4, title: "Fitness myths debunked in 60 seconds", creator: "danmartell", platform: "youtube", platformUrl: "https://youtube.com/shorts/example4", thumbnail: "https://picsum.photos/seed/v4/270/480", outlier: 2.1, views: "42K", engagement: "8%", postedAgo: "3d ago", outlierScore: 21, viewsNum: 42000 },
  { id: 5, title: "This changed my workout routine forever", creator: "falkefit", platform: "tiktok", platformUrl: "https://tiktok.com/@falkefit/video/example5", thumbnail: "https://picsum.photos/seed/v5/270/480", outlier: 1.2, views: "19K", engagement: "5%", postedAgo: "1d ago", outlierScore: 12, viewsNum: 19000 },
  { id: 6, title: "The #1 mistake people make at the gym", creator: "therealbrianmark", platform: "instagram", platformUrl: "https://instagram.com/reel/example6", thumbnail: "https://picsum.photos/seed/v6/270/480", outlier: 1.8, views: "35K", engagement: "7%", postedAgo: "2d ago", outlierScore: 18, viewsNum: 35000 },
  { id: 7, title: "Quick abs workout for busy people", creator: "devinfitofficial", platform: "instagram", platformUrl: "https://instagram.com/reel/example7", thumbnail: "https://picsum.photos/seed/v7/270/480", outlier: 1.4, views: "22K", engagement: "6%", postedAgo: "1d ago", outlierScore: 14, viewsNum: 22000 },
  { id: 8, title: "Nutrition secrets from pro athletes", creator: "kelseypoulter", platform: "youtube", platformUrl: "https://youtube.com/shorts/example8", thumbnail: "https://picsum.photos/seed/v8/270/480", outlier: 1.6, views: "28K", engagement: "7%", postedAgo: "2d ago", outlierScore: 16, viewsNum: 28000 },
  { id: 9, title: "5 minute morning energy boost", creator: "_macro_daddy", platform: "youtube", platformUrl: "https://youtube.com/shorts/example9", thumbnail: "https://picsum.photos/seed/v9/270/480", outlier: 0.9, views: "11K", engagement: "3%", postedAgo: "3d ago", outlierScore: 9, viewsNum: 11000 },
  { id: 10, title: "How I get shredded without starving", creator: "alexastancofit", platform: "instagram", platformUrl: "https://instagram.com/reel/example10", thumbnail: "https://picsum.photos/seed/v10/270/480", outlier: 2.0, views: "38K", engagement: "8%", postedAgo: "1d ago", outlierScore: 20, viewsNum: 38000 },
  { id: 11, title: "Mobility routine that actually works", creator: "coachdango", platform: "tiktok", platformUrl: "https://tiktok.com/@coachdango/video/example11", thumbnail: "https://picsum.photos/seed/v11/270/480", outlier: 1.1, views: "16K", engagement: "4%", postedAgo: "2d ago", outlierScore: 11, viewsNum: 16000 },
  { id: 12, title: "Meal prep for the entire week", creator: "danmartell", platform: "instagram", platformUrl: "https://instagram.com/reel/example12", thumbnail: "https://picsum.photos/seed/v12/270/480", outlier: 1.7, views: "32K", engagement: "6%", postedAgo: "3d ago", outlierScore: 17, viewsNum: 32000 },
  { id: 13, title: "Why you're not getting stronger", creator: "falkefit", platform: "youtube", platformUrl: "https://youtube.com/shorts/example13", thumbnail: "https://picsum.photos/seed/v13/270/480", outlier: 1.4, views: "24K", engagement: "5%", postedAgo: "1d ago", outlierScore: 14, viewsNum: 24000 },
  { id: 14, title: "Recovery tips from elite trainers", creator: "therealbrianmark", platform: "tiktok", platformUrl: "https://tiktok.com/@therealbrianmark/video/example14", thumbnail: "https://picsum.photos/seed/v14/270/480", outlier: 1.3, views: "20K", engagement: "5%", postedAgo: "2d ago", outlierScore: 13, viewsNum: 20000 },
  { id: 15, title: "Cardio myths that need to die", creator: "devinfitofficial", platform: "youtube", platformUrl: "https://youtube.com/shorts/example15", thumbnail: "https://picsum.photos/seed/v15/270/480", outlier: 1.9, views: "36K", engagement: "7%", postedAgo: "1d ago", outlierScore: 19, viewsNum: 36000 },
  { id: 16, title: "How to build muscle in 30 days", creator: "kelseypoulter", platform: "instagram", platformUrl: "https://instagram.com/reel/example16", thumbnail: "https://picsum.photos/seed/v16/270/480", outlier: 2.2, views: "45K", engagement: "9%", postedAgo: "2d ago", outlierScore: 22, viewsNum: 45000 },
  { id: 17, title: "Stretching routine for flexibility", creator: "_macro_daddy", platform: "instagram", platformUrl: "https://instagram.com/reel/example17", thumbnail: "https://picsum.photos/seed/v17/270/480", outlier: 1.0, views: "14K", engagement: "4%", postedAgo: "3d ago", outlierScore: 10, viewsNum: 14000 },
  { id: 18, title: "The best home workout equipment", creator: "alexastancofit", platform: "youtube", platformUrl: "https://youtube.com/shorts/example18", thumbnail: "https://picsum.photos/seed/v18/270/480", outlier: 1.5, views: "26K", engagement: "6%", postedAgo: "1d ago", outlierScore: 15, viewsNum: 26000 },
  { id: 19, title: "Post-workout meal ideas", creator: "coachdango", platform: "instagram", platformUrl: "https://instagram.com/reel/example19", thumbnail: "https://picsum.photos/seed/v19/270/480", outlier: 1.2, views: "17K", engagement: "5%", postedAgo: "2d ago", outlierScore: 12, viewsNum: 17000 },
  { id: 20, title: "Sleep optimization for gains", creator: "danmartell", platform: "tiktok", platformUrl: "https://tiktok.com/@danmartell/video/example20", thumbnail: "https://picsum.photos/seed/v20/270/480", outlier: 1.6, views: "29K", engagement: "6%", postedAgo: "3d ago", outlierScore: 16, viewsNum: 29000 },
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

const platformColors = {
  "YouTube Shorts": { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  "TikTok": { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Instagram Reels": { bg: "bg-pink-100", text: "text-pink-600", dot: "bg-pink-500" },
  "Instagram": { bg: "bg-pink-100", text: "text-pink-600", dot: "bg-pink-500" },
};

const PlatformBadge = ({ platform }) => {
  const c = platformColors[platform] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {platform}
    </span>
  );
};

// Simple platform badge component for watchlist/suggestions
const SimplePlatformBadge = ({ platform }) => {
  const colors = { 
    instagram: { bg: "#E1306C", label: "IG" }, 
    tiktok: { bg: "#000000", label: "TT" }, 
    youtube: { bg: "#FF0000", label: "YT" } 
  };
  const c = colors[platform] || { bg: "#999", label: "?" };
  return (
    <span style={{ 
      width: 24, height: 24, borderRadius: "50%", 
      backgroundColor: c.bg,
      color: "white", fontSize: 10, fontWeight: 700,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      position: "absolute", bottom: -4, right: -4, border: "2px solid white"
    }}>
      {c.label}
    </span>
  );
};

const OutlierBadge = ({ score }) => {
  const bg = score >= 20 ? "bg-gradient-to-r from-orange-400 to-pink-500" : score >= 10 ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gray-300";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${bg}`}>
      <TrendingUp size={11} /> {score}x
    </span>
  );
};

// ============================================================
// DASHBOARD PAGE
// ============================================================

const DashboardPage = ({ stats, setCurrentPage }) => {
  const topOutlier = [...SAMPLE_VIDEOS].sort((a, b) => b.outlierScore - a.outlierScore)[0];
  const recentActivity = [
    { icon: Users, text: "Added creator to watchlist", time: "2 hours ago", color: "text-blue-500" },
    { icon: Bookmark, text: "Saved 3 videos to Vault", time: "4 hours ago", color: "text-pink-500" },
    { icon: PenTool, text: "Generated script", time: "Yesterday", color: "text-purple-500" },
    { icon: TrendingUp, text: "New outlier detected", time: "Yesterday", color: "text-orange-500" },
    { icon: Users, text: "Added creator to watchlist", time: "2 days ago", color: "text-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, Michael</h1>
        <p className="text-gray-500 mt-1">Here's what's blowing up in short-form right now.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Flame, label: "Creators Watched", value: stats.channelsWatched, gradient: "from-orange-400 to-pink-500", change: "+2 this week" },
          { icon: Video, label: "Videos Saved", value: stats.videosSaved, gradient: "from-blue-400 to-indigo-500", change: "Feed active" },
          { icon: PenTool, label: "Scripts Written", value: stats.scriptsWritten, gradient: "from-purple-400 to-pink-500", change: "Ready to write" },
          { icon: Bookmark, label: "Vault Items", value: stats.vaultItems, gradient: "from-emerald-400 to-teal-500", change: `${stats.vaultItems} saved` },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
            <div className="text-xs text-green-500 font-medium mt-1">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Discover Creators", desc: "Find new creators to watch", page: "channels", gradient: "from-blue-500 to-cyan-500" },
          { icon: Video, label: "Browse Feed", desc: "See latest from your watchlist", page: "videos", gradient: "from-purple-500 to-pink-500" },
          { icon: Wand2, label: "Write a Script", desc: "Generate viral content", page: "scripts", gradient: "from-orange-500 to-red-500" },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(action.page)}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon size={18} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">{action.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            <ChevronRight size={14} className="text-gray-400 mt-2 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      {/* Top Outlier Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">Top Outlier Today</h2>
        <div className="mt-3 flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">📹</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{topOutlier.title}</h3>
            <p className="text-white/70 text-sm mt-1">{topOutlier.creator} · {topOutlier.views} views · {topOutlier.outlierScore}x outlier</p>
          </div>
          <OutlierBadge score={topOutlier.outlierScore} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Trending Outliers */}
        <div className="col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trending Outliers</h2>
          <div className="grid gap-3">
            {[...SAMPLE_VIDEOS].sort((a, b) => b.outlierScore - a.outlierScore).slice(0, 5).map((v, idx) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 text-sm font-semibold truncate group-hover:text-pink-600 transition-colors">{v.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{v.creator} · {v.platform}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 block">{v.views}</span>
                    <span className="text-xs text-gray-400">{v.postedAgo}</span>
                  </div>
                  <OutlierBadge score={v.outlierScore} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <a.icon size={14} className={`${a.color} mt-0.5 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.time}</p>
                </div>
              </div>
            ))}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountSizeFilter, setAccountSizeFilter] = useState("all");
  const [suggestions, setSuggestions] = useState(SAMPLE_SUGGESTIONS);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [hoveredWatchlistItem, setHoveredWatchlistItem] = useState(null);

  const filteredSuggestions = suggestions.filter(s => {
    if (platformFilter !== "all" && s.platform !== platformFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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

  return (
    <div className="flex gap-6">
      {/* Main Content Area */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
          <p className="text-sm text-gray-500 mt-1">Pick which channels to include in your videos feed</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Describe your content, or find a channel by handle"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <select
              value={accountSizeFilter}
              onChange={(e) => setAccountSizeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Sizes</option>
              <option value="large">Large (1M+)</option>
              <option value="medium">Medium (100K-1M)</option>
              <option value="small">Small (Under 100K)</option>
            </select>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Search
            </button>
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Suggestions</h3>
          <div className="grid grid-cols-2 gap-4">
            {filteredSuggestions.map(creator => (
              <div
                key={creator.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-pink-300 transition-all group relative"
                onMouseEnter={() => setHoveredSuggestion(creator.id)}
                onMouseLeave={() => setHoveredSuggestion(null)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <SimplePlatformBadge platform={creator.platform} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{creator.name}</h4>
                    <p className="text-xs text-gray-500">{creator.followers}</p>
                  </div>
                </div>
                
                {hoveredSuggestion === creator.id && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => window.open(creator.platformUrl, "_blank")}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                      title="View Profile"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={() => addToWatchlist(creator)}
                      className="p-2 bg-pink-500 rounded-lg hover:bg-pink-600 text-white transition-colors"
                      title="Add to Watchlist"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Watchlist */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Your Watchlist</h3>
            <Link size={14} className="text-gray-400" />
          </div>

          <button className="w-full mb-4 px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors">
            Save
          </button>

          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {watchlist.map(creator => (
              <div
                key={creator.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors relative"
                onMouseEnter={() => setHoveredWatchlistItem(creator.id)}
                onMouseLeave={() => setHoveredWatchlistItem(null)}
              >
                <div className="relative">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <SimplePlatformBadge platform={creator.platform} />
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => window.open(creator.platformUrl, "_blank")}
                    className="text-xs font-semibold text-gray-900 hover:text-pink-600 truncate block text-left transition-colors"
                  >
                    {creator.name}
                  </button>
                  <p className="text-xs text-gray-500">{creator.followers}</p>
                </div>

                {hoveredWatchlistItem === creator.id && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => window.open(creator.platformUrl, "_blank")}
                      className="p-1 hover:bg-gray-300 rounded text-gray-600 transition-colors"
                      title="View Profile"
                    >
                      <ExternalLink size={12} />
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(creator.id)}
                      className="p-1 hover:bg-red-200 rounded text-red-600 transition-colors"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VIDEOS PAGE (with Feed/Vault tabs)
// ============================================================

const VideosPage = ({ watchlist, savedVideos, setSavedVideos, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
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

  // Get videos from watchlist creators
  const feedVideos = SAMPLE_VIDEOS.filter(v =>
    watchlist.some(w => w.name === v.creator)
  );

  // Apply filters
  const filteredVideos = (activeTab === "feed" ? feedVideos : savedVideos).filter(v => {
    if (outlierMin && v.outlierScore < parseFloat(outlierMin)) return false;
    if (outlierMax && v.outlierScore > parseFloat(outlierMax)) return false;
    if (viewsMin) {
      const minViews = parseInt(viewsMin.replace(/K|M/g, m => m === "K" ? 1000 : 1000000));
      if (v.viewsNum < minViews) return false;
    }
    if (viewsMax) {
      const maxViews = parseInt(viewsMax.replace(/K|M/g, m => m === "K" ? 1000 : 1000000));
      if (v.viewsNum > maxViews) return false;
    }
    if (engagementMin && v.engagement < parseFloat(engagementMin)) return false;
    if (engagementMax && v.engagement > parseFloat(engagementMax)) return false;
    if (channelFilter !== "all" && v.creator !== channelFilter) return false;
    if (platformFilter !== "all" && v.platform !== platformFilter) return false;
    if (keywords && !v.title.toLowerCase().includes(keywords.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "outlier") return b.outlierScore - a.outlierScore;
    if (sortBy === "views") return b.viewsNum - a.viewsNum;
    if (sortBy === "engagement") return b.engagement - a.engagement;
    return 0;
  });

  const saveToVault = (video) => {
    if (!savedVideos.find(v => v.id === video.id)) {
      setSavedVideos(prev => [...prev, video]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === "feed" ? "Save high-performing videos to your vault to unlock deep analysis" : "Videos you've saved to your vault"}
        </p>
      </div>

      {/* Feed / Vault Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-6">
          {["feed", "vault"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-gray-900 border-pink-500"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab === "feed" ? "Feed" : "Vault"}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 text-sm">
          {activeTab === "feed" ? (
            <button
              onClick={() => setCurrentPage("channels")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings size={14} />
              Configure channels
            </button>
          ) : (
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
              <Plus size={14} />
              Add video URL
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BarChart3 size={14} />
              Sort by
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 w-40">
                  {[
                    { key: "newest", label: "Newest" },
                    { key: "outlier", label: "Outlier score" },
                    { key: "views", label: "Views" },
                    { key: "engagement", label: "Engagement rate" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === opt.key ? "text-pink-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Filters + Grid Layout */}
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filters</h3>
              <button
                onClick={() => {
                  setOutlierMin("");
                  setOutlierMax("");
                  setViewsMin("");
                  setViewsMax("");
                  setEngagementMin("");
                  setEngagementMax("");
                  setChannelFilter("all");
                  setPlatformFilter("all");
                  setKeywords("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="space-y-4">
              {/* Channels Dropdown */}
              <div className="relative">
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Channels</label>
                <button
                  onClick={() => setShowChannelDropdown(!showChannelDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 transition-colors flex items-center justify-between"
                >
                  <span className={channelFilter === "all" ? "text-gray-500" : "text-gray-900"}>
                    {channelFilter === "all" ? "All channels" : channelFilter}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {showChannelDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowChannelDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-30 max-h-56 overflow-y-auto">
                      <button
                        onClick={() => {
                          setChannelFilter("all");
                          setShowChannelDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          channelFilter === "all" ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        All channels
                      </button>
                      {watchlist.map(creator => (
                        <button
                          key={creator.id}
                          onClick={() => {
                            setChannelFilter(creator.name);
                            setShowChannelDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                            channelFilter === creator.name ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <img src={creator.avatar} alt="" className="w-6 h-6 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <span className="truncate block text-sm">{creator.name}</span>
                            <span className="text-xs text-gray-500">{creator.followers}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Outlier Score */}
              <div>
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Outlier Score</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={outlierMin}
                    onChange={(e) => setOutlierMin(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={outlierMax}
                    onChange={(e) => setOutlierMax(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Views */}
              <div>
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Views</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    value={viewsMin}
                    onChange={(e) => setViewsMin(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Max"
                    value={viewsMax}
                    onChange={(e) => setViewsMax(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Engagement */}
              <div>
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Engagement %</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={engagementMin}
                    onChange={(e) => setEngagementMin(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={engagementMax}
                    onChange={(e) => setEngagementMax(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Platform</label>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              {/* Keywords */}
              <div>
                <label className="text-xs text-gray-600 block mb-1.5 font-medium">Keywords</label>
                <input
                  type="text"
                  placeholder="Search titles..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <button className="w-full px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors">
                Save Filter
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-4 gap-4">
            {filteredVideos.map(video => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredVideoId(video.id)}
                onMouseLeave={() => setHoveredVideoId(null)}
              >
                {/* 9:16 Thumbnail */}
                <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-2" style={{ paddingBottom: "177.78%" }}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Platform Badge */}
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold" style={{
                    backgroundColor: video.platform === "instagram" ? "#E1306C" : video.platform === "tiktok" ? "#000" : "#FF0000",
                    color: "white"
                  }}>
                    {video.platform === "instagram" ? "IG" : video.platform === "tiktok" ? "TT" : "YT"}
                  </div>

                  {/* Hover Overlay */}
                  {hoveredVideoId === video.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-3">
                      <button
                        onClick={() => saveToVault(video)}
                        className="px-4 py-2 bg-pink-500 text-white text-xs font-medium rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        Save to vault
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div>
                  <a
                    href={video.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-gray-900 line-clamp-2 hover:text-pink-600 transition-colors block"
                  >
                    {video.title}
                  </a>

                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                    <span>@{video.creator}</span>
                    <span>{video.postedAgo}</span>
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-blue-600 font-medium flex items-center gap-0.5">
                      <TrendingUp size={10} /> {video.outlier}x
                    </span>
                    <span className="text-green-600 font-medium flex items-center gap-0.5">
                      <Eye size={10} /> {video.views}
                    </span>
                    <span className="text-orange-600 font-medium flex items-center gap-0.5">
                      <Sparkles size={10} /> {video.engagement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No videos found. Try adjusting your filters.</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Scripts</h1>
        <p className="text-sm text-gray-500 mt-1">Generate viral video scripts from your saved content</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
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
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">All Types</option>
          <option value="hook">Hooks</option>
          <option value="style">Styles</option>
          <option value="structure">Structures</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                item.type === "hook" ? "bg-blue-500" :
                item.type === "style" ? "bg-orange-500" :
                "bg-green-500"
              }`}>
                {item.type === "hook" ? "H" : item.type === "style" ? "S" : "St"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{item.type}</span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{item.content}</p>
                <p className="text-xs text-gray-500">Source: {item.source}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{item.views}</p>
                <div className="flex gap-1 mt-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
            <input type="email" defaultValue="michael@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
            <input type="text" defaultValue="Michael Chen" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
          </div>
          <button className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium">
            Save Changes
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500 mt-1">Get notified about new outliers and saved videos</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
              <p className="text-xs text-gray-500 mt-1">Receive weekly summary of trending content</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "videos", label: "Videos", icon: Video, section: "Research" },
  { id: "ideas", label: "Ideas", icon: Lightbulb, section: "Research" },
  { id: "scripts", label: "Scripts", icon: PenTool, section: "Create" },
  { id: "channels", label: "Channels", icon: Users, section: "Configure" },
  { id: "settings", label: "Settings", icon: Settings, section: "Configure" },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchlist, setWatchlist] = useState(SAMPLE_WATCHLIST);
  const [savedVideos, setSavedVideos] = useState([]);
  const [scriptsWritten, setScriptsWritten] = useState(0);

  const vaultItems = [...SAMPLE_HOOKS, ...SAMPLE_STYLES, ...SAMPLE_STRUCTURES];

  const stats = {
    channelsWatched: watchlist.length,
    videosSaved: savedVideos.length,
    scriptsWritten,
    vaultItems: vaultItems.length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            O
          </div>
          {sidebarOpen && <span className="font-bold text-gray-900">Optimus.AI</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title={item.label}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ChevronDown size={18} className={`transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {NAV_ITEMS.find(n => n.id === currentPage)?.label}
            </h1>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                <Search size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {currentPage === "dashboard" && <DashboardPage stats={stats} setCurrentPage={setCurrentPage} />}
          {currentPage === "channels" && <ChannelsPage watchlist={watchlist} setWatchlist={setWatchlist} />}
          {currentPage === "videos" && <VideosPage watchlist={watchlist} savedVideos={savedVideos} setSavedVideos={setSavedVideos} setCurrentPage={setCurrentPage} />}
          {currentPage === "scripts" && <ScriptsPage vaultItems={vaultItems} scriptsWritten={scriptsWritten} setScriptsWritten={setScriptsWritten} />}
          {currentPage === "ideas" && <div className="text-center py-12"><p className="text-gray-500">Ideas page coming soon</p></div>}
          {currentPage === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
