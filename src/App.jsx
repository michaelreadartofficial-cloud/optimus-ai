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
// SAMPLE DATA — Short-Form Only (TikTok, Reels, Shorts)
// ============================================================

const SAMPLE_VIDEOS = [
  {
    id: 1,
    title: "I Tried Living on $1 for 24 Hours",
    channel: "Ryan Trahan",
    channelId: 1,
    platform: "YouTube Shorts",
    views: "48.2M",
    viewsNum: 48200000,
    likes: "2.1M",
    comments: "45K",
    outlierScore: 28.5,
    uploadDate: "3 days ago",
    duration: "0:58",
    emoji: "🎬",
    niche: "Lifestyle",
    hook: "What if I told you that you could survive an entire day on just one dollar?",
    transcript: "What if I told you that you could survive an entire day on just one dollar? Most people think it's impossible, but I'm about to prove them wrong. First stop — the dollar store...",
    engagement: 4.3,
  },
  {
    id: 2,
    title: "This Trick Makes You Sound Smarter Instantly",
    channel: "Jade Bowler",
    channelId: 6,
    platform: "TikTok",
    views: "12.7M",
    viewsNum: 12700000,
    likes: "890K",
    comments: "23K",
    outlierScore: 15.2,
    uploadDate: "1 week ago",
    duration: "0:34",
    emoji: "🧠",
    niche: "Education",
    hook: "Stop using the word 'very'. Here's what smart people say instead.",
    transcript: "Stop using the word 'very'. Here's what smart people say instead. Instead of 'very tired', say 'exhausted'...",
    engagement: 7.1,
  },
  {
    id: 3,
    title: "POV: You Finally Quit Your 9-5",
    channel: "Alex Hormozi",
    channelId: 3,
    platform: "Instagram Reels",
    views: "8.4M",
    viewsNum: 8400000,
    likes: "620K",
    comments: "18K",
    outlierScore: 12.8,
    uploadDate: "5 days ago",
    duration: "0:45",
    emoji: "💼",
    niche: "Business",
    hook: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next.",
    transcript: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next. Month one...",
    engagement: 7.4,
  },
  {
    id: 4,
    title: "The Psychology Behind Why You Can't Stop Scrolling",
    channel: "Ali Abdaal",
    channelId: 2,
    platform: "YouTube Shorts",
    views: "22.1M",
    viewsNum: 22100000,
    likes: "1.5M",
    comments: "34K",
    outlierScore: 19.3,
    uploadDate: "2 days ago",
    duration: "0:52",
    emoji: "📱",
    niche: "Psychology",
    hook: "Your phone is literally designed to be addictive. Here's the science behind it.",
    transcript: "Your phone is literally designed to be addictive. Here's the science behind it...",
    engagement: 6.8,
  },
  {
    id: 5,
    title: "I Asked 100 Millionaires Their #1 Habit",
    channel: "Mark Tilbury",
    channelId: 4,
    platform: "TikTok",
    views: "31.5M",
    viewsNum: 31500000,
    likes: "1.8M",
    comments: "52K",
    outlierScore: 24.1,
    uploadDate: "4 days ago",
    duration: "0:41",
    emoji: "💰",
    niche: "Finance",
    hook: "I spent 6 months interviewing 100 millionaires and they all said the same thing.",
    transcript: "I spent 6 months interviewing 100 millionaires and they all said the same thing...",
    engagement: 5.7,
  },
  {
    id: 6,
    title: "Why Japan's Trains Are Never Late",
    channel: "Abroad in Japan",
    channelId: 5,
    platform: "Instagram Reels",
    views: "15.8M",
    viewsNum: 15800000,
    likes: "1.1M",
    comments: "28K",
    outlierScore: 16.7,
    uploadDate: "1 week ago",
    duration: "0:55",
    emoji: "🚄",
    niche: "Travel",
    hook: "In Japan, if a train is even 60 seconds late, the company issues a formal apology.",
    transcript: "In Japan, if a train is even 60 seconds late, the company issues a formal apology...",
    engagement: 6.9,
  },
  {
    id: 7,
    title: "This Meal Prep Changed My Life (5 Mins)",
    channel: "Ethan Chlebowski",
    channelId: 1,
    platform: "TikTok",
    views: "9.6M",
    viewsNum: 9600000,
    likes: "740K",
    comments: "21K",
    outlierScore: 11.4,
    uploadDate: "6 days ago",
    duration: "0:48",
    emoji: "🍳",
    niche: "Food",
    hook: "This 5-minute meal prep will save you $200 a month.",
    transcript: "This 5-minute meal prep will save you $200 a month...",
    engagement: 7.7,
  },
  {
    id: 8,
    title: "The Real Reason You're Always Tired",
    channel: "Dr. Mike",
    channelId: 5,
    platform: "YouTube Shorts",
    views: "19.3M",
    viewsNum: 19300000,
    likes: "1.3M",
    comments: "41K",
    outlierScore: 17.9,
    uploadDate: "3 days ago",
    duration: "0:39",
    emoji: "😴",
    niche: "Health",
    hook: "You're not tired because you're not sleeping enough.",
    transcript: "You're not tired because you're not sleeping enough...",
    engagement: 6.7,
  },
];

const SAMPLE_CHANNELS = [
  { id: 1, name: "Ryan Trahan", platform: "YouTube Shorts", subscribers: "12.4M", avgViews: "5.2M", videos: 342, niche: "Lifestyle", emoji: "🎬" },
  { id: 2, name: "Ali Abdaal", platform: "YouTube Shorts", subscribers: "5.8M", avgViews: "1.8M", videos: 520, niche: "Productivity", emoji: "📚" },
  { id: 3, name: "Alex Hormozi", platform: "Instagram Reels", subscribers: "3.2M", avgViews: "2.1M", videos: 890, niche: "Business", emoji: "💪" },
  { id: 4, name: "Mark Tilbury", platform: "TikTok", subscribers: "8.1M", avgViews: "3.5M", videos: 1200, niche: "Finance", emoji: "💰" },
  { id: 5, name: "Dr. Mike", platform: "TikTok", subscribers: "11.2M", avgViews: "4.1M", videos: 650, niche: "Health", emoji: "🩺" },
  { id: 6, name: "Jade Bowler", platform: "YouTube Shorts", subscribers: "1.9M", avgViews: "800K", videos: 280, niche: "Education", emoji: "🧠" },
];

const SAMPLE_WATCHLISTS = [
  { id: 1, name: "AI & Tech", channels: [1, 2, 3] },
  { id: 2, name: "Finance & Business", channels: [3, 4] },
  { id: 3, name: "Health & Lifestyle", channels: [5, 1] },
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
    { icon: Users, text: "Added Ryan Trahan to AI & Tech watchlist", time: "2 hours ago", color: "text-blue-500" },
    { icon: Bookmark, text: "Saved 3 videos to Vault", time: "4 hours ago", color: "text-pink-500" },
    { icon: PenTool, text: "Generated script about morning routines", time: "Yesterday", color: "text-purple-500" },
    { icon: TrendingUp, text: "New 28.5x outlier detected from Ryan Trahan", time: "Yesterday", color: "text-orange-500" },
    { icon: Users, text: "Added Mark Tilbury to Finance watchlist", time: "2 days ago", color: "text-green-500" },
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
          { icon: Flame, label: "Channels Watched", value: stats.channelsWatched, gradient: "from-orange-400 to-pink-500", change: "+2 this week" },
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
          { icon: Users, label: "Discover Channels", desc: "Find new creators to watch", page: "channels", gradient: "from-blue-500 to-cyan-500" },
          { icon: Video, label: "Browse Feed", desc: "See latest from watchlists", page: "videos", gradient: "from-purple-500 to-pink-500" },
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
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">{topOutlier.emoji}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{topOutlier.title}</h3>
            <p className="text-white/70 text-sm mt-1">{topOutlier.channel} · {topOutlier.views} views · {topOutlier.outlierScore}x outlier</p>
            <div className="flex gap-4 mt-2 text-white/60 text-xs">
              <span><Eye size={12} className="inline mr-1" />{topOutlier.views}</span>
              <span><Heart size={12} className="inline mr-1" />{topOutlier.likes}</span>
              <span><MessageCircle size={12} className="inline mr-1" />{topOutlier.comments}</span>
            </div>
          </div>
          <OutlierBadge score={topOutlier.outlierScore} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Trending Outliers */}
        <div className="col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trending Short-Form Outliers</h2>
          <div className="grid gap-3">
            {[...SAMPLE_VIDEOS].sort((a, b) => b.outlierScore - a.outlierScore).slice(0, 5).map((v, idx) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{idx + 1}</div>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{v.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 text-sm font-semibold truncate group-hover:text-pink-600 transition-colors">{v.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{v.channel} · {v.platform}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 block">{v.views}</span>
                    <span className="text-xs text-gray-400">{v.uploadDate}</span>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-snug">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "YouTube Shorts", count: SAMPLE_VIDEOS.filter(v => v.platform === "YouTube Shorts").length, avgOutlier: "21.9x", color: "from-red-400 to-red-600", icon: "▶" },
            { name: "TikTok", count: SAMPLE_VIDEOS.filter(v => v.platform === "TikTok").length, avgOutlier: "16.9x", color: "from-cyan-400 to-cyan-600", icon: "♪" },
            { name: "Instagram Reels", count: SAMPLE_VIDEOS.filter(v => v.platform === "Instagram Reels").length, avgOutlier: "14.8x", color: "from-pink-400 to-purple-500", icon: "📷" },
          ].map((p, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-3 text-white text-lg`}>
                {p.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Videos tracked</span>
                  <span className="font-semibold text-gray-900">{p.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg outlier</span>
                  <span className="font-semibold text-gray-900">{p.avgOutlier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHANNELS PAGE (Creators & Watchlists)
// ============================================================

const ChannelsPage = ({ watchlists, setWatchlists }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [showNewWatchlist, setShowNewWatchlist] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);

  const filteredChannels = SAMPLE_CHANNELS.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddChannelToWatchlist = (watchlistId, channelId) => {
    setWatchlists(watchlists.map(w =>
      w.id === watchlistId
        ? { ...w, channels: [...new Set([...w.channels, channelId])] }
        : w
    ));
    setSelectedChannel(null);
  };

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      setWatchlists([...watchlists, { id: Date.now(), name: newWatchlistName, channels: [] }]);
      setNewWatchlistName("");
      setShowNewWatchlist(false);
    }
  };

  const watchlistChannels = selectedWatchlist
    ? SAMPLE_CHANNELS.filter(c => selectedWatchlist.channels.includes(c.id))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Channels</h1>
        <p className="text-gray-500 mt-1">Discover creators and organize them into watchlists to track their content.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Search & Results */}
        <div className="col-span-2 space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by creator name or niche..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all ${selectedChannel?.id === channel.id ? "border-pink-500 shadow-md" : "border-gray-100 hover:border-gray-200"}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xl">{channel.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{channel.name}</h3>
                    <p className="text-xs text-gray-500">{channel.niche}</p>
                  </div>
                </div>
                <PlatformBadge platform={channel.platform} />
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p><Users size={11} className="inline mr-1" />{channel.subscribers} subscribers</p>
                  <p><Eye size={11} className="inline mr-1" />{channel.avgViews} avg views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Watchlists & Channel Detail */}
        <div className="space-y-6">
          {/* Watchlists */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Your Watchlists</h2>
              <button
                onClick={() => setShowNewWatchlist(!showNewWatchlist)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {showNewWatchlist && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <input
                  type="text"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="Watchlist name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateWatchlist}
                    className="flex-1 bg-pink-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-pink-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewWatchlist(false); setNewWatchlistName(""); }}
                    className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {watchlists.map(wl => (
                <button
                  key={wl.id}
                  onClick={() => setSelectedWatchlist(wl)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedWatchlist?.id === wl.id ? "bg-pink-50 border border-pink-200" : "hover:bg-gray-50 border border-transparent"}`}
                >
                  <p className="text-sm font-semibold text-gray-900">{wl.name}</p>
                  <p className="text-xs text-gray-500">{wl.channels.length} channels</p>
                </button>
              ))}
            </div>
          </div>

          {/* Channel Detail or Watchlist View */}
          {selectedChannel && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl mb-3">{selectedChannel.emoji}</div>
                <h3 className="font-bold text-gray-900">{selectedChannel.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedChannel.subscribers} subscribers</p>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform</span>
                  <PlatformBadge platform={selectedChannel.platform} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 mb-2">Add to watchlist:</label>
                {watchlists.map(wl => (
                  <button
                    key={wl.id}
                    onClick={() => handleAddChannelToWatchlist(wl.id, selectedChannel.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${wl.channels.includes(selectedChannel.id) ? "bg-green-50 border border-green-200 text-green-700" : "bg-gray-50 border border-gray-200 hover:border-pink-300"}`}
                  >
                    <span className="font-medium">{wl.name}</span>
                    {wl.channels.includes(selectedChannel.id) && <Check size={14} className="inline ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedWatchlist && !selectedChannel && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">{selectedWatchlist.name}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {watchlistChannels.length > 0 ? (
                  watchlistChannels.map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="font-medium text-gray-900 flex-1">{c.name}</span>
                      <button
                        onClick={() => {
                          setWatchlists(watchlists.map(w =>
                            w.id === selectedWatchlist.id
                              ? { ...w, channels: w.channels.filter(ch => ch !== c.id) }
                              : w
                          ));
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-4 text-center">No channels yet. Add one above.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VIDEOS PAGE (Feed & Vault)
// ============================================================

const VideosPage = ({ watchlists, savedVideos, setSavedVideos, setSelectedVideoDetail }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [viewsFilter, setViewsFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [outlierFilter, setOutlierFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("outlier");

  // Get videos from watchlisted channels
  const watchlistedChannelIds = new Set(watchlists.flatMap(w => w.channels));
  const feedVideos = SAMPLE_VIDEOS.filter(v => watchlistedChannelIds.has(v.channelId));

  // Apply filters
  const filteredVideos = (activeTab === "feed" ? feedVideos : savedVideos).filter(v => {
    if (outlierFilter === "2x" && v.outlierScore < 20) return false;
    if (outlierFilter === "1.5x" && v.outlierScore < 15) return false;
    if (platformFilter !== "all" && v.platform !== platformFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "outlier") return b.outlierScore - a.outlierScore;
    if (sortBy === "views") return b.viewsNum - a.viewsNum;
    if (sortBy === "engagement") return b.engagement - a.engagement;
    return 0;
  });

  const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Videos</h1>
        <p className="text-gray-500 mt-1">Discover and save videos from your watchlisted channels.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "feed", label: "Feed", icon: Activity, count: feedVideos.length },
          { key: "vault", label: "Vault", icon: Bookmark, count: savedVideos.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === tab.key ? "text-pink-600 border-pink-600" : "text-gray-600 border-transparent hover:text-gray-900"}`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === "feed" && watchlistedChannelIds.size === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <AlertCircle size={24} className="mx-auto text-blue-600 mb-2" />
          <p className="text-blue-900 font-semibold">No watchlists created yet</p>
          <p className="text-blue-700 text-sm mt-1">Go to Channels to add creators to your watchlists and see their videos here.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <select value={outlierFilter} onChange={(e) => setOutlierFilter(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Outlier Levels</option>
                <option value="2x">&gt; 2x outlier</option>
                <option value="1.5x">&gt; 1.5x outlier</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="all">All Platforms</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="all">Any Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="outlier">Outlier Score</option>
                <option value="views">Views</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-4 gap-4">
            {filteredVideos.map(video => {
              const isSaved = savedVideos.some(v => v.id === video.id);
              return (
                <div key={video.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedVideoDetail(video)}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-4xl overflow-hidden">
                    {video.emoji}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg p-1.5">
                      <PlatformBadge platform={video.platform} />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium">
                      {video.duration}
                    </div>
                    {/* Hover Overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSavedVideos(prev => isSaved ? prev.filter(v => v.id !== video.id) : [...prev, video]);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSaved ? "bg-pink-500" : "bg-white/30 group-hover:bg-white/50"}`}>
                        <Bookmark size={20} className={isSaved ? "text-white fill-current" : "text-white"} />
                      </div>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">{video.title}</h3>
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <span className="font-medium">{video.channel}</span>
                      <span>·</span>
                      <span>{video.uploadDate}</span>
                    </div>

                    {/* Hook Preview */}
                    <p className="text-xs text-gray-500 italic line-clamp-1 mb-3">"{video.hook}"</p>

                    {/* Stats */}
                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><TrendingUp size={10} /> Outlier</span>
                        <OutlierBadge score={video.outlierScore} />
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Eye size={10} /> Views</span>
                        <span className="font-semibold text-gray-900">{video.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Heart size={10} /> Engagement</span>
                        <span className="font-semibold text-gray-900">{video.engagement}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Video size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No videos found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================
// VIDEO DETAIL PAGE
// ============================================================

const VideoDetailPage = ({ video, setSelectedVideoDetail, savedVideos, setSavedVideos }) => {
  const [activeTab, setActiveTab] = useState("metrics");
  const isSaved = savedVideos.some(v => v.id === video.id);

  const handleSave = () => {
    setSavedVideos(prev =>
      isSaved ? prev.filter(v => v.id !== video.id) : [...prev, video]
    );
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => setSelectedVideoDetail(null)}
        className="flex items-center gap-2 text-pink-600 font-semibold hover:text-pink-700 mb-4"
      >
        <ChevronLeft size={18} /> Back to Feed
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Info & Thumbnail */}
        <div className="col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 aspect-video rounded-2xl flex items-center justify-center text-6xl">
            {video.emoji}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xl">
                {SAMPLE_CHANNELS.find(c => c.id === video.channelId)?.emoji}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">{video.channel}</h2>
                <p className="text-sm text-gray-500">{SAMPLE_CHANNELS.find(c => c.id === video.channelId)?.subscribers} subscribers</p>
              </div>
            </div>

            <PlatformBadge platform={video.platform} />

            <button
              onClick={handleSave}
              className={`w-full mt-4 px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isSaved ? "bg-pink-100 text-pink-700 hover:bg-pink-200" : "bg-pink-600 text-white hover:bg-pink-700"}`}
            >
              <Bookmark size={16} className={isSaved ? "" : ""} />
              {isSaved ? "Saved to Vault" : "Save to Vault"}
            </button>
          </div>
        </div>

        {/* Right: Tabbed Content */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{video.title}</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap">
              {["metrics", "transcript", "hook", "description", "structure", "style"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 capitalize ${activeTab === tab ? "text-pink-600 border-pink-600" : "text-gray-600 border-transparent hover:text-gray-900"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "metrics" && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Outlier Score", value: `${video.outlierScore}x`, icon: TrendingUp, color: "from-orange-400 to-pink-500" },
                    { label: "Views", value: video.views, icon: Eye, color: "from-blue-400 to-cyan-400" },
                    { label: "Engagement Rate", value: `${video.engagement}%`, icon: ThumbsUp, color: "from-green-400 to-emerald-400" },
                    { label: "Likes", value: video.likes, icon: Heart, color: "from-red-400 to-pink-400" },
                    { label: "Comments", value: video.comments, icon: MessageCircle, color: "from-purple-400 to-blue-400" },
                       { label: "Channel Followers", value: SAMPLE_CHANNELS.find(c => c.id === video.channelId)?.subscribers || "N/A", icon: Users, color: "from-yellow-400 to-orange-400" },
                  ].map((metric, i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-2`}>
                        <metric.icon size={18} className="text-white" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{metric.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{video.transcript}</p>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold text-sm hover:bg-pink-700">
                      <Copy size={14} /> Copy
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200">
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "hook" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                    <p className="text-gray-900 leading-relaxed">{video.hook}</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold text-sm hover:bg-pink-700">
                    <Copy size={14} /> Copy Hook
                  </button>
                </div>
              )}

              {activeTab === "description" && (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">No additional description available.</p>
                </div>
              )}

              {activeTab === "structure" && (
                <div className="space-y-4">
                  <p className="text-gray-700">Video Structure (Analysis not available for demo data)</p>
                </div>
              )}

              {activeTab === "style" && (
                <div className="space-y-4">
                  <p className="text-gray-700">Style Analysis (Analysis not available for demo data)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SCRIPTS PAGE
// ============================================================

const ScriptsPage = ({ vaultItems, scriptsWritten, setScriptsWritten }) => {
  const [selectedHook, setSelectedHook] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [topic, setTopic] = useState("");
  const [generatedScript, setGeneratedScript] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptHistory, setScriptHistory] = useState([]);

  const hooks = SAMPLE_HOOKS;
  const styles = SAMPLE_STYLES;
  const structures = SAMPLE_STRUCTURES;

  const generateScript = async () => {
    if (!selectedHook || !selectedStyle || !topic) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const script = {
        hook: selectedHook.content.replace("[topic]", topic),
        body: `Let me break this down for you. When it comes to ${topic}, most people get it completely wrong. Here's what the top 1% actually do differently.\n\nFirst, they focus on consistency over intensity. Instead of going all-in for a week and burning out, they commit to small, daily actions.\n\nSecond, they leverage systems, not willpower. The secret isn't motivation — it's building an environment that makes the right choice the easy choice.\n\nThird, they measure what matters. Not vanity metrics, but the numbers that actually move the needle.`,
        cta: "If this changed how you think about " + topic + ", drop a comment below with your biggest takeaway. And make sure to follow for more content like this!",
        structure: selectedStructure?.content || "Hook → Context → Key Points → CTA",
        style: selectedStyle.content,
        wordCount: 127,
        estDuration: "0:45 - 1:00",
        timestamp: new Date().toLocaleString(),
      };
      setGeneratedScript(script);
      setScriptHistory(prev => [script, ...prev].slice(0, 5));
      setScriptsWritten(scriptsWritten + 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const readinessCount = [selectedHook, selectedStyle, topic].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Script Generator</h1>
          <p className="text-gray-500 mt-1">Combine hooks, styles, and topics to generate viral scripts.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText size={14} />
          <span>{scriptsWritten} scripts generated</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {[
            { label: "Hook", done: !!selectedHook, color: "purple" },
            { label: "Style", done: !!selectedStyle, color: "green" },
            { label: "Topic", done: !!topic, color: "yellow" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? `bg-${step.color}-500 text-white` : "bg-gray-200 text-gray-500"}`}>
                {step.done ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          {/* Hook Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Hook</h2>
                <p className="text-xs text-gray-500">The attention-grabbing opening line</p>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {hooks.map(hook => (
                <button
                  key={hook.id}
                  onClick={() => setSelectedHook(hook)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${selectedHook?.id === hook.id ? "bg-purple-100 border border-purple-300 shadow-sm" : "bg-gray-50 border border-transparent hover:bg-gray-100"}`}
                >
                  <p className="font-medium text-gray-900 line-clamp-2">{hook.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-500">{hook.source}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{hook.views} views</span>
                    {hook.tags?.map((tag, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Palette size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Style</h2>
                <p className="text-xs text-gray-500">How the video feels and flows</p>
              </div>
            </div>

            <div className="space-y-2">
              {styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${selectedStyle?.id === style.id ? "bg-green-100 border border-green-300 shadow-sm" : "bg-gray-50 border border-transparent hover:bg-gray-100"}`}
                >
                  <p className="font-medium text-gray-900 line-clamp-2">{style.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{style.source}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Structure Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Layers size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Structure</h2>
                <p className="text-xs text-gray-500">The framework for your script (optional)</p>
              </div>
            </div>

            <div className="space-y-2">
              {structures.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStructure(selectedStructure?.id === s.id ? null : s)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${selectedStructure?.id === s.id ? "bg-blue-100 border border-blue-300 shadow-sm" : "bg-gray-50 border border-transparent hover:bg-gray-100"}`}
                >
                  <p className="font-medium text-gray-900">{s.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.source}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <ZapIcon size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Topic</h2>
                <p className="text-xs text-gray-500">What your video is about</p>
              </div>
            </div>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'morning productivity routine', '5 habits of millionaires'"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateScript}
            disabled={!selectedHook || !selectedStyle || !topic || isGenerating}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <><RefreshCw size={16} className="animate-spin" /> Generating your script...</>
            ) : (
              <><Sparkles size={16} /> Generate Script ({readinessCount}/3 ready)</>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Generated Script</h2>
              {generatedScript && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{generatedScript.wordCount} words</span>
                  <span>·</span>
                  <span>{generatedScript.estDuration}</span>
                </div>
              )}
            </div>

            {generatedScript ? (
              <div className="space-y-4">
                {/* Hook Section */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-4">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1"><Target size={10} /> Hook</p>
                  <p className="text-gray-900 font-semibold leading-relaxed">{generatedScript.hook}</p>
                </div>

                {/* Body Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><FileText size={10} /> Body</p>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{generatedScript.body}</p>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4">
                  <p className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1"><Zap size={10} /> Call to Action</p>
                  <p className="text-gray-900 font-semibold leading-relaxed">{generatedScript.cta}</p>
                </div>

                {/* Meta info */}
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-1">Script Info</p>
                  <div className="space-y-1">
                    <p>Structure: {generatedScript.structure}</p>
                    <p>Style: {generatedScript.style}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                    <Copy size={14} /> Copy Script
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                    <Download size={14} />
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                    <Bookmark size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Wand2 size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-gray-500">No script yet</p>
                <p className="text-sm mt-1">Select a hook, style, and enter a topic to generate your viral script</p>
              </div>
            )}
          </div>

          {/* Script History */}
          {scriptHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Recent Scripts</h3>
              <div className="space-y-2">
                {scriptHistory.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setGeneratedScript(s)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all text-sm"
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">{s.hook}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.timestamp} · {s.wordCount} words</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VAULT PAGE
// ============================================================

const VaultPage = ({ savedVideos, setSavedVideos, setSelectedVideoDetail, setCurrentPage }) => {
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const allItems = [
    ...SAMPLE_HOOKS,
    ...SAMPLE_STYLES,
    ...SAMPLE_STRUCTURES,
    ...savedVideos.map(v => ({ ...v, type: "video" })),
  ];

  const filtered = allItems.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const content = (item.content || item.title || "").toLowerCase();
      const source = (item.source || item.channel || "").toLowerCase();
      return content.includes(searchLower) || source.includes(searchLower);
    }
    return true;
  });

  const counts = {
    all: allItems.length,
    hook: SAMPLE_HOOKS.length,
    style: SAMPLE_STYLES.length,
    structure: SAMPLE_STRUCTURES.length,
    video: savedVideos.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Vault</h1>
          <p className="text-gray-500 mt-1">Your saved hooks, styles, structures, and videos — all in one place.</p>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Archive size={14} />
          {allItems.length} items saved
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your vault..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All Items", icon: LayoutGrid },
          { key: "hook", label: "Hooks", icon: Target },
          { key: "style", label: "Styles", icon: Palette },
          { key: "structure", label: "Structures", icon: Layers },
          { key: "video", label: "Videos", icon: Video },
        ].map(type => (
          <button
            key={type.key}
            onClick={() => setFilterType(type.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterType === type.key ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <type.icon size={14} />
            {type.label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${filterType === type.key ? "bg-white/20" : "bg-gray-200"}`}>
              {counts[type.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(item => {
          if (item.type === "video") {
            return (
              <div key={`video-${item.id}`} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group" onClick={() => { setSelectedVideoDetail(item); setCurrentPage("videos"); }}>
                <div className="relative aspect-video bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-3xl">
                  {item.emoji}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg p-1">
                    <PlatformBadge platform={item.platform} />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium">{item.duration}</div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-pink-500 mb-1 flex items-center gap-1"><Video size={10} /> Saved Video</p>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-pink-600 transition-colors">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.channel} · {item.views} views</p>
                  <div className="flex items-center gap-2 mt-2">
                    <OutlierBadge score={item.outlierScore} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setSavedVideos(prev => prev.filter(v => v.id !== item.id)); }}
                      className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const colorMap = {
            hook: { bg: "from-purple-100 to-purple-50", border: "border-purple-200", accent: "text-purple-600", icon: Target },
            style: { bg: "from-green-100 to-green-50", border: "border-green-200", accent: "text-green-600", icon: Palette },
            structure: { bg: "from-blue-100 to-blue-50", border: "border-blue-200", accent: "text-blue-600", icon: Layers },
          };
          const colors = colorMap[item.type];
          const ItemIcon = colors.icon;

          return (
            <div key={item.id} className={`bg-gradient-to-br ${colors.bg} rounded-2xl border-2 ${colors.border} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase tracking-wider ${colors.accent} flex items-center gap-1`}>
                    <ItemIcon size={10} /> {item.type}
                  </p>
                  <h3 className="font-bold text-gray-900 mt-1.5 line-clamp-2 leading-snug">{item.content}</h3>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2">
                  <Trash2 size={14} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">From: {item.source}</p>

              {item.views && <p className="text-xs text-gray-500 mb-2"><Eye size={10} className="inline mr-1" />{item.views} views</p>}

              {item.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium text-gray-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button className={`mt-3 flex items-center gap-1 text-xs font-semibold ${colors.accent} hover:opacity-80`}>
                <Copy size={10} /> Copy to clipboard
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Archive size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-500">No items found</p>
          <p className="text-sm mt-1">
            {searchTerm ? "Try a different search term" : "Start saving hooks, styles, and videos to your vault"}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SETTINGS PAGE
// ============================================================

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("account");

  const sections = [
    { id: "account", label: "Account", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "content", label: "Content Preferences", icon: Filter },
    { id: "api", label: "API & Integrations", icon: Key },
    { id: "about", label: "About", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your preferences, integrations, and account.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm sticky top-4">
            <div className="space-y-1">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === s.id ? "bg-pink-50 text-pink-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <s.icon size={16} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-3 space-y-6">
          {activeSection === "account" && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-6">Account Information</h2>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">M</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Michael</h3>
                    <p className="text-sm text-gray-500">michaelreadartofficial@gmail.com</p>
                    <p className="text-xs text-green-600 font-medium mt-1">Pro Plan</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input type="text" defaultValue="Michael" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" defaultValue="michaelreadartofficial@gmail.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Usage Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Channels tracked", value: "6", limit: "50" },
                    { label: "Scripts this month", value: "0", limit: "100" },
                    { label: "Vault items", value: "6", limit: "500" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}<span className="text-sm text-gray-400 font-normal">/{stat.limit}</span></p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full" style={{ width: `${(parseInt(stat.value) / parseInt(stat.limit)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-5">
                {[
                  { label: "Viral alerts", desc: "Get notified when outliers hit >20x", defaultOn: true },
                  { label: "Weekly digest", desc: "Receive a weekly summary of top-performing videos", defaultOn: true },
                  { label: "New uploads", desc: "Alerts when watchlisted channels post new videos", defaultOn: true },
                  { label: "Trending hooks", desc: "Discover new high-performing hooks for your niche", defaultOn: false },
                  { label: "Script suggestions", desc: "AI-powered content ideas based on your interests", defaultOn: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "content" && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Favorite Niches</h2>
                <p className="text-sm text-gray-500 mb-4">Select the niches you're interested in for better recommendations.</p>
                <div className="flex flex-wrap gap-2">
                  {["Finance", "Business", "Health", "Travel", "Lifestyle", "Education", "Tech", "Food", "Fitness", "Psychology"].map((niche, i) => (
                    <button key={niche} className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${i < 4 ? "bg-pink-100 text-pink-700 hover:bg-pink-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {niche} {i < 4 && <X size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Platform Preferences</h2>
                <div className="space-y-3">
                  {["YouTube Shorts", "TikTok", "Instagram Reels"].map(platform => (
                    <div key={platform} className="flex items-center justify-between py-2">
                      <PlatformBadge platform={platform} />
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Outlier Threshold</h2>
                <p className="text-sm text-gray-500 mb-4">Minimum outlier score for alerts and feed highlighting.</p>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="30" defaultValue="10" className="flex-1" />
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">10x</span>
                </div>
              </div>
            </>
          )}

          {activeSection === "api" && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-2">API Keys</h2>
                <p className="text-sm text-gray-500 mb-6">Connect external services to unlock full functionality.</p>
                <div className="space-y-5">
                  {[
                    { label: "YouTube Data API v3", desc: "Required for channel discovery and video tracking", placeholder: "AIza...", connected: false },
                    { label: "Claude API (Anthropic)", desc: "Powers AI script generation", placeholder: "sk-ant-...", connected: false },
                  ].map((api, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{api.label}</h3>
                          <p className="text-xs text-gray-500">{api.desc}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${api.connected ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                          {api.connected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input type="password" placeholder={api.placeholder} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-700 transition-colors">
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">API keys are stored securely</p>
                    <p className="text-xs text-blue-700 mt-1">Your keys are encrypted and never shared. They're used only to make API calls on your behalf.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "about" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">O</div>
                <h2 className="text-2xl font-extrabold text-gray-900">Optimus.AI</h2>
                <p className="text-gray-500 mt-1">Viral Short-Form Content Engine</p>
                <p className="text-xs text-gray-400 mt-2">Version 1.0.0</p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                <p>Optimus.AI helps you discover viral short-form content, analyze what makes it work, and generate scripts that capture the same energy.</p>
                <p>Track creators across YouTube Shorts, TikTok, and Instagram Reels. Save the best hooks, styles, and structures to your vault. Then combine them to write scripts that are designed to go viral.</p>
              </div>
            </div>
          )}
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
  { id: "channels", label: "Channels", icon: Users },
  { id: "videos", label: "Videos", icon: Video },
  { id: "scripts", label: "Scripts", icon: PenTool },
  { id: "vault", label: "Vault", icon: Archive },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchlists, setWatchlists] = useState(SAMPLE_WATCHLISTS);
  const [savedVideos, setSavedVideos] = useState([]);
  const [selectedVideoDetail, setSelectedVideoDetail] = useState(null);
  const [scriptsWritten, setScriptsWritten] = useState(0);

  const vaultItems = [...SAMPLE_HOOKS, ...SAMPLE_STYLES, ...SAMPLE_STRUCTURES];

  const stats = {
    channelsWatched: watchlists.reduce((acc, w) => acc + w.channels.length, 0),
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
              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600">
                <Search size={18} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {selectedVideoDetail && currentPage === "videos" ? (
            <VideoDetailPage
              video={selectedVideoDetail}
              setSelectedVideoDetail={setSelectedVideoDetail}
              savedVideos={savedVideos}
              setSavedVideos={setSavedVideos}
            />
          ) : currentPage === "dashboard" ? (
            <DashboardPage stats={stats} setCurrentPage={setCurrentPage} />
          ) : currentPage === "channels" ? (
            <ChannelsPage watchlists={watchlists} setWatchlists={setWatchlists} />
          ) : currentPage === "videos" ? (
            <VideosPage
              watchlists={watchlists}
              savedVideos={savedVideos}
              setSavedVideos={setSavedVideos}
              setSelectedVideoDetail={setSelectedVideoDetail}
            />
          ) : currentPage === "scripts" ? (
            <ScriptsPage vaultItems={vaultItems} scriptsWritten={scriptsWritten} setScriptsWritten={setScriptsWritten} />
          ) : currentPage === "vault" ? (
            <VaultPage savedVideos={savedVideos} setSavedVideos={setSavedVideos} setSelectedVideoDetail={setSelectedVideoDetail} setCurrentPage={setCurrentPage} />
          ) : currentPage === "settings" ? (
            <SettingsPage />
          ) : null}
        </div>
      </div>
    </div>
  );
}
