import { useState, useEffect } from "react";
// Optimus.AI v2.1  Hook/Explain/Illustrate/Teach framework
import { Search, TrendingUp, Zap, BookOpen, Archive, Settings, Eye, ThumbsUp, MessageCircle, Clock, Star, Copy, ChevronDown, Plus, Sparkles, RefreshCw, X, BarChart3, Users, Video, Bookmark, Flame, ArrowRight, Lightbulb, PenTool, Layers, Play } from "lucide-react";

// ============================================================
// SAMPLE DATA ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Short-Form Only (TikTok, Reels, Shorts)
// ============================================================

const SAMPLE_VIDEOS = [
  { id: 1, title: "I Tried Living on $1 for 24 Hours", channel: "Ryan Trahan", platform: "YouTube Shorts", views: "48.2M", likes: "2.1M", comments: "45K", outlierScore: 28.5, uploadDate: "3 days ago", duration: "0:58", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬", niche: "Lifestyle", hook: "What if I told you that you could survive an entire day on just one dollar?", transcript: "What if I told you that you could survive an entire day on just one dollar? Most people think it's impossible, but I'm about to prove them wrong. First stop ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ the dollar store..." },
  { id: 2, title: "This Trick Makes You Sound Smarter Instantly", channel: "Jade Bowler", platform: "TikTok", views: "12.7M", likes: "890K", comments: "23K", outlierScore: 15.2, uploadDate: "1 week ago", duration: "0:34", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂ§ÃÂÃÂ ", niche: "Education", hook: "Stop using the word 'very'. Here's what smart people say instead.", transcript: "Stop using the word 'very'. Here's what smart people say instead. Instead of 'very tired', say 'exhausted'. Instead of 'very happy', say 'ecstatic'..." },
  { id: 3, title: "POV: You Finally Quit Your 9-5", channel: "Alex Hormozi", platform: "Instagram Reels", views: "8.4M", likes: "620K", comments: "18K", outlierScore: 12.8, uploadDate: "5 days ago", duration: "0:45", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¼", niche: "Business", hook: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next.", transcript: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next. Month one ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ I made zero dollars. Month two ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ still zero..." },
  { id: 4, title: "The Psychology Behind Why You Can't Stop Scrolling", channel: "Ali Abdaal", platform: "YouTube Shorts", views: "22.1M", likes: "1.5M", comments: "34K", outlierScore: 19.3, uploadDate: "2 days ago", duration: "0:52", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±", niche: "Psychology", hook: "Your phone is literally designed to be addictive. Here's the science behind it.", transcript: "Your phone is literally designed to be addictive. Here's the science behind it. It's called variable ratio reinforcement ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ the same psychology behind slot machines..." },
  { id: 5, title: "I Asked 100 Millionaires Their #1 Habit", channel: "Mark Tilbury", platform: "TikTok", views: "31.5M", likes: "1.8M", comments: "52K", outlierScore: 24.1, uploadDate: "4 days ago", duration: "0:41", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°", niche: "Finance", hook: "I spent 6 months interviewing 100 millionaires and they all said the same thing.", transcript: "I spent 6 months interviewing 100 millionaires and they all said the same thing. It wasn't waking up at 5am. It wasn't cold showers. It was this one simple habit..." },
  { id: 6, title: "Why Japan's Trains Are Never Late", channel: "Abroad in Japan", platform: "Instagram Reels", views: "15.8M", likes: "1.1M", comments: "28K", outlierScore: 16.7, uploadDate: "1 week ago", duration: "0:55", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ", niche: "Travel", hook: "In Japan, if a train is even 60 seconds late, the company issues a formal apology.", transcript: "In Japan, if a train is even 60 seconds late, the company issues a formal apology. But how do they maintain this insane level of punctuality? It comes down to three things..." },
  { id: 7, title: "This Meal Prep Changed My Life (5 Mins)", channel: "Ethan Chlebowski", platform: "TikTok", views: "9.6M", likes: "740K", comments: "21K", outlierScore: 11.4, uploadDate: "6 days ago", duration: "0:48", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³", niche: "Food", hook: "This 5-minute meal prep will save you $200 a month. And it actually tastes good.", transcript: "This 5-minute meal prep will save you $200 a month. And it actually tastes good. All you need are five ingredients..." },
  { id: 8, title: "The Real Reason You're Always Tired", channel: "Dr. Mike", platform: "YouTube Shorts", views: "19.3M", likes: "1.3M", comments: "41K", outlierScore: 17.9, uploadDate: "3 days ago", duration: "0:39", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´", niche: "Health", hook: "You're not tired because you're not sleeping enough. You're tired because of this.", transcript: "You're not tired because you're not sleeping enough. You're tired because of this. Most people don't realize that chronic fatigue comes from three hidden causes..." },
];

const SAMPLE_CHANNELS = [
  { name: "Ryan Trahan", platform: "YouTube Shorts", subscribers: "12.4M", avgViews: "5.2M", videos: 342, niche: "Lifestyle", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬" },
  { name: "Ali Abdaal", platform: "YouTube Shorts", subscribers: "5.8M", avgViews: "1.8M", videos: 520, niche: "Productivity", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ" },
  { name: "Alex Hormozi", platform: "Instagram Reels", subscribers: "3.2M", avgViews: "2.1M", videos: 890, niche: "Business", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª" },
  { name: "Mark Tilbury", platform: "TikTok", subscribers: "8.1M", avgViews: "3.5M", videos: 1200, niche: "Finance", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°" },
  { name: "Dr. Mike", platform: "TikTok", subscribers: "11.2M", avgViews: "4.1M", videos: 650, niche: "Health", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂ©ÃÂÃÂº" },
  { name: "Jade Bowler", platform: "YouTube Shorts", subscribers: "1.9M", avgViews: "800K", videos: 280, niche: "Education", emoji: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂ§ÃÂÃÂ " },
];

const HOOK_TEMPLATES = [
  { type: "Question", icon: "ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ", hooks: ["What if I told you [unexpected claim]?", "Did you know that [shocking statistic]?", "Why does nobody talk about [hidden truth]?", "Have you ever wondered why [common thing] works this way?"] },
  { type: "Controversy", icon: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¥", hooks: ["Everyone is wrong about [topic]. Here's the truth.", "[Popular advice] is actually ruining your [area].", "I'm going to say something that might upset a lot of people.", "Stop doing [common habit]. It's destroying your [result]."] },
  { type: "Story", icon: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ", hooks: ["I spent [time] doing [extreme thing]. Here's what happened.", "Nobody believed me when I said [claim]. Then this happened.", "Last week, something changed my mind completely about [topic].", "Three years ago I was [bad situation]. Today I [good outcome]."] },
  { type: "Statistic", icon: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ", hooks: ["[X]% of people don't know this about [topic].", "I analyzed [large number] of [things] and found this pattern.", "According to [source], [surprising finding].", "Only [small number] of people will ever [achievement]. Here's why."] },
];

const VAULT_ITEMS = [
  { id: 1, type: "hook", content: "What if I told you that everything you know about [topic] is wrong?", source: "Ryan Trahan", tags: ["question", "curiosity gap"], saved: "2 days ago" },
  { id: 2, type: "style", content: "Fast-paced cuts with text overlays, jump cuts every 2-3 seconds, high energy voiceover", source: "Ali Abdaal", tags: ["editing", "pacing"], saved: "1 week ago" },
  { id: 3, type: "hook", content: "I spent $10,000 testing this so you don't have to.", source: "Mark Tilbury", tags: ["story", "investment"], saved: "3 days ago" },
  { id: 4, type: "structure", content: "Hook (3s) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Context (5s) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ 3 Key Points (20s) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ Twist (5s) ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ CTA (3s)", source: "Jade Bowler", tags: ["framework", "short-form"], saved: "5 days ago" },
];

// ============================================================
// SMALL REUSABLE PIECES
// ============================================================

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
// PAGES
// ============================================================

const DashboardPage = ({ setPage }) => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, Michael ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ</h1>
      <p className="text-gray-500 mt-1">Here's what's blowing up in short-form right now.</p>
    </div>

    {/* Stats Row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: Flame, label: "Outliers Found", value: "24", gradient: "from-orange-400 to-pink-500" },
        { icon: Video, label: "Videos Analyzed", value: "156", gradient: "from-blue-400 to-indigo-500" },
        { icon: PenTool, label: "Scripts Written", value: "12", gradient: "from-purple-400 to-pink-500" },
        { icon: Bookmark, label: "Vault Items", value: "38", gradient: "from-emerald-400 to-teal-500" },
      ].map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}>
            <s.icon size={18} className="text-white" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
          <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>

    {/* Top Outlier */}
    <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white">
      <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Top Outlier Today</h2>
      <div className="mt-3 flex items-start gap-4">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">{SAMPLE_VIDEOS[0].emoji}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{SAMPLE_VIDEOS[0].title}</h3>
          <p className="text-white/70 text-sm mt-1">{SAMPLE_VIDEOS[0].channel} ÃÂÃÂÃÂÃÂ· {SAMPLE_VIDEOS[0].views} views ÃÂÃÂÃÂÃÂ· {SAMPLE_VIDEOS[0].outlierScore}x outlier</p>
          <button onClick={() => setPage("videos")} className="mt-3 bg-white text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1">
            View analysis <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>

    {/* Trending */}
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¥ Trending Short-Form Outliers</h2>
      <div className="grid gap-3">
        {SAMPLE_VIDEOS.slice(0, 5).map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => setPage("videos")}>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{v.emoji}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 text-sm font-semibold truncate group-hover:text-pink-600 transition-colors">{v.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{v.channel} ÃÂÃÂÃÂÃÂ· {v.platform}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">{v.views}</span>
              <OutlierBadge score={v.outlierScore} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DiscoverPage = ({ setPage, setSelectedCreator }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [creators, setCreators] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All platforms");
  const [accountSize, setAccountSize] = useState("All sizes");
  const [watchlist, setWatchlist] = useState([]);

  const searchCreators = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setError(null);
    setCreators([]);
    setHasSearched(true);
    try {
      const results = [];
      // Search YouTube
      if (platformFilter === "All platforms" || platformFilter === "YouTube") {
        const ytRes = await fetch("/api/search-creators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm }),
        });
        const ytData = await ytRes.json();
        if (ytRes.ok && ytData.creators) results.push(...ytData.creators);
      }
      // Search Instagram
      if (platformFilter === "All platforms" || platformFilter === "Instagram") {
        const igRes = await fetch("/api/search-creators-instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm }),
        });
        const igData = await igRes.json();
        if (igRes.ok && igData.creators) results.push(...igData.creators);
      }
      // Filter by account size
      let filtered = results;
      if (accountSize === "< 10K") filtered = results.filter(c => c.subscriberCount < 10000);
      else if (accountSize === "10K - 100K") filtered = results.filter(c => c.subscriberCount >= 10000 && c.subscriberCount < 100000);
      else if (accountSize === "100K - 1M") filtered = results.filter(c => c.subscriberCount >= 100000 && c.subscriberCount < 1000000);
      else if (accountSize === "> 1M") filtered = results.filter(c => c.subscriberCount >= 1000000);
      filtered.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
      setCreators(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleWatchlist = (creator) => {
    setWatchlist(prev => {
      const exists = prev.find(c => c.id === creator.id && c.platform === creator.platform);
      if (exists) return prev.filter(c => !(c.id === creator.id && c.platform === creator.platform));
      return [...prev, creator];
    });
  };

  const isInWatchlist = (creator) => watchlist.some(c => c.id === creator.id && c.platform === creator.platform);

  const platformIcon = (platform) => {
    if (!platform) return null;
    if (platform.includes("Instagram")) return (
      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"}}>
        <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      </span>
    );
    if (platform.includes("TikTok")) return (
      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center border border-gray-200">
        <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.4a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 005.58 2.17v-3.35z"/></svg>
      </span>
    );
    if (platform.includes("YouTube")) return (
      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-gray-200">
        <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </span>
    );
    return null;
  };

  const handleCreatorClick = (creator) => {
    setSelectedCreator(creator);
    setPage("creator-detail");
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
          <p className="text-gray-400 text-sm mt-1">Pick which channels to include in your videos feed</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input type="text" placeholder="Describe your content, or search for a channel by handle" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCreators()} className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all" />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 mb-6">
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none hover:border-gray-300 cursor-pointer appearance-none pr-8" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center"}}>
            <option>Platform</option>
            <option value="All platforms">All platforms</option>
            <option value="YouTube">YouTube</option>
            <option value="Instagram">Instagram</option>
          </select>
          <select value={accountSize} onChange={(e) => setAccountSize(e.target.value)} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 focus:outline-none hover:border-gray-300 cursor-pointer appearance-none pr-8" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center"}}>
            <option>Account size</option>
            <option value="All sizes">All sizes</option>
            <option value="< 10K">{"< 10K"}</option>
            <option value="10K - 100K">10K - 100K</option>
            <option value="100K - 1M">100K - 1M</option>
            <option value="> 1M">{"> 1M"}</option>
          </select>
          <div className="flex-1" />
          <button onClick={searchCreators} disabled={isSearching || !searchTerm.trim()} className="text-gray-900 hover:text-gray-600 disabled:opacity-40 px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all">
            {isSearching ? <><RefreshCw size={14} className="animate-spin" /> Searching...</> : <>Search <ArrowRight size={14} /></>}
          </button>
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {/* Loading */}
        {isSearching && (
          <div className="text-center py-16">
            <RefreshCw size={20} className="animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Searching for "{searchTerm}" creators...</p>
          </div>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && creators.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No creators found for "{searchTerm}". Try a different niche or adjust filters.</p>
          </div>
        )}

        {/* Suggestions Label */}
        {creators.length > 0 && !isSearching && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
          </div>
        )}

        {/* Creator Grid */}
        {creators.length > 0 && !isSearching && (
          <div className="grid grid-cols-2 gap-3">
            {creators.map((creator, i) => (
              <div key={creator.id || i} className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer group" onClick={() => handleCreatorClick(creator)}>
                <div className="relative flex-shrink-0">
                  <img src={creator.thumbnail} alt={creator.name} className="w-14 h-14 rounded-full object-cover bg-gray-100" onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' rx='28' fill='%23f3f4f6'/%3E%3Ctext x='28' y='33' text-anchor='middle' font-size='20' fill='%239ca3af'%3E%3F%3C/text%3E%3C/svg%3E"; }} />
                  {platformIcon(creator.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900 truncate">{creator.username || creator.name}</span>
                    {creator.isVerified && <span className="text-blue-500 text-xs">ÃÂ¢ÃÂÃÂ</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{creator.subscribers || "N/A"}{(creator.subscribers && creator.subscribers.toString().toLowerCase().includes("followers")) ? "" : " followers"}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(creator); }} className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isInWatchlist(creator) ? "bg-pink-100 text-pink-500" : "bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100"}`}>
                  <Plus size={16} className={isInWatchlist(creator) ? "rotate-45" : ""} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && !isSearching && (
          <div className="text-center py-20">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Find channels to follow</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">Describe your content niche or search for a specific creator handle to discover channels for your feed.</p>
          </div>
        )}
      </div>

      {/* Watchlist Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Your Watchlist</h3>
            <span className="text-xs text-gray-400">{watchlist.length} channels</span>
          </div>
          {watchlist.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Click + on a creator card to add them to your watchlist</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {watchlist.map((creator, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <img src={creator.thumbnail} alt={creator.username || creator.name} className="w-8 h-8 rounded-full object-cover bg-gray-100" onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' rx='16' fill='%23f3f4f6'/%3E%3Ctext x='16' y='20' text-anchor='middle' font-size='12' fill='%239ca3af'%3E%3F%3C/text%3E%3C/svg%3E"; }} />
                    {platformIcon(creator.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{creator.username || creator.name}</p>
                    <p className="text-[10px] text-gray-400">{creator.subscribers || "N/A"}{(creator.subscribers && creator.subscribers.toString().toLowerCase().includes("followers")) ? "" : " followers"}</p>
                  </div>
                  <button onClick={() => toggleWatchlist(creator)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {watchlist.length > 0 && (
            <button className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-all">
              Save Watchlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreatorDetailPage = ({ creator, setPage, setPageState }) => {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const loadVideos = async () => {
    if (!creator) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/creator-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          uploadsPlaylistId: creator.uploadsPlaylistId,
          platform: creator.platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load videos");
      setVideos(data.videos || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (creator) loadVideos();
  }, [creator?.id]);

  if (selectedVideo) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedVideo(null)} className="text-sm text-gray-400 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">ÃÂÃÂ¯ÃÂÃÂ¿ÃÂÃÂ½ Back to {creator.name}'s videos</button>
        <div className="flex items-start gap-5">
          <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-40 h-24 rounded-xl object-cover bg-gray-100" />
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-gray-900">{selectedVideo.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{creator.name} ÃÂÃÂ¯ÃÂÃÂ¿ÃÂÃÂ½ {new Date(selectedVideo.publishedAt).toLocaleDateString()} ÃÂÃÂ¯ÃÂÃÂ¿ÃÂÃÂ½ {selectedVideo.durationFormatted}</p>
            <div className="flex items-center gap-2 mt-2">
              <OutlierBadge score={selectedVideo.outlierScore} />
              <PlatformBadge platform="YouTube Shorts" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Eye, label: "Views", value: selectedVideo.viewsFormatted, color: "text-blue-500 bg-blue-50" },
            { icon: ThumbsUp, label: "Likes", value: selectedVideo.likesFormatted, color: "text-green-500 bg-green-50" },
            { icon: MessageCircle, label: "Comments", value: selectedVideo.commentsFormatted, color: "text-purple-500 bg-purple-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className={"w-9 h-9 rounded-xl " + s.color + " flex items-center justify-center mx-auto mb-2"}><s.icon size={16} /></div>
              <div className="text-lg font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
        {selectedVideo.outlierScore >= 2 && (
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-pink-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} className="text-orange-500" />
              <span className="font-bold text-gray-900 text-sm">Outlier Alert  {selectedVideo.outlierScore}x above average</span>
            </div>
            <p className="text-gray-600 text-sm">This video got {selectedVideo.outlierScore}x more views than {creator.name}'s average. This is the type of content worth studying and remixing.</p>
            <button onClick={() => { setPageState({ remixTranscript: selectedVideo.title + ". " + selectedVideo.description }); setPage("scripts"); }} className="mt-3 bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
              <RefreshCw size={14} /> Remix This Content
            </button>
          </div>
        )}
        {selectedVideo.description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><BookOpen size={16} className="text-blue-500" /> Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{selectedVideo.description}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Play size={16} className="text-red-500" /> Watch Original</h2>
          <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 text-sm font-medium underline">{selectedVideo.url}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => setPage("videos")} className="text-sm text-gray-400 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">ÃÂÃÂ¯ÃÂÃÂ¿ÃÂÃÂ½ Back to Discover</button>
      <div className="flex items-center gap-5">
        <img src={creator.thumbnail} alt={creator.name} className="w-20 h-20 rounded-full object-cover bg-gray-100" onError={(e) => { e.target.style.display = "none"; }} />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{creator.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <PlatformBadge platform={creator.platform} />
            <span className="text-sm text-gray-500">{creator.subscribers} subscribers</span>
            <span className="text-sm text-gray-400">{creator.videoCount} videos</span>
          </div>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Shorts Found", value: stats.shortsCount, icon: Video, gradient: "from-pink-400 to-rose-500" },
            { label: "Avg Views", value: stats.avgViews, icon: Eye, gradient: "from-blue-400 to-indigo-500" },
            { label: "Median Views", value: stats.medianViews, icon: BarChart3, gradient: "from-purple-400 to-pink-500" },
            { label: "Top Outlier", value: stats.topOutlierScore + "x", icon: TrendingUp, gradient: "from-orange-400 to-pink-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={"w-9 h-9 rounded-xl bg-gradient-to-br " + s.gradient + " flex items-center justify-center mb-2"}>
                <s.icon size={15} className="text-white" />
              </div>
              <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw size={24} className="animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Pulling {creator.name}'s videos and calculating outlier scores...</p>
        </div>
      )}
      {!isLoading && videos.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Videos ranked by outlier score</h2>
          <div className="grid gap-3">
            {videos.map((video, i) => (
              <div key={video.id || i} onClick={() => setSelectedVideo(video)} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-pink-200 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img src={video.thumbnail} alt={video.title} className="w-28 h-16 rounded-lg object-cover bg-gray-100" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{video.durationFormatted}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-bold text-sm group-hover:text-pink-600 transition-colors truncate">{video.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={11} /> {video.viewsFormatted}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><ThumbsUp size={11} /> {video.likesFormatted}</span>
                      <span className="text-xs text-gray-400">{new Date(video.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <OutlierBadge score={video.outlierScore} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoading && videos.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No videos found for this creator.</p>
        </div>
      )}
    </div>
  );
};

const ChannelsPage = ({ setPage, setSelectedCreator }) => {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackedCreators, setTrackedCreators] = useState([]);

  const addCreatorByUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: urlInput.replace(/https?:\/\/.*youtube\.com\/@?/,'').replace(/\/.*$/,''), platform: "YouTube Shorts" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to find creator");
      if (data.creators && data.creators.length > 0) {
        const creator = data.creators[0];
        if (!trackedCreators.find(c => c.id === creator.id)) {
          setTrackedCreators(prev => [...prev, creator]);
        }
        setUrlInput("");
      } else {
        throw new Error("Creator not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorClick = (creator) => {
    setSelectedCreator(creator);
    setPage("creator-detail");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Tracked Creators</h1>
        <p className="text-gray-500 mt-1">Add creators to track and analyze their viral patterns over time.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex gap-3">
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCreatorByUrl()} placeholder="Paste a YouTube channel URL or type a creator name..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <button onClick={addCreatorByUrl} disabled={isLoading || !urlInput.trim()} className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
            {isLoading ? <><RefreshCw size={14} className="animate-spin" /> Finding...</> : <><Plus size={14} /> Add Creator</>}
          </button>
        </div>
        {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
      </div>
      {trackedCreators.length > 0 ? (
        <div className="grid gap-3">
          {trackedCreators.map((creator, i) => (
            <div key={creator.id || i} onClick={() => handleCreatorClick(creator)} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <img src={creator.thumbnail} alt={creator.name} className="w-14 h-14 rounded-full object-cover bg-gray-100" onError={(e) => { e.target.style.display = "none"; }} />
                <div className="flex-1">
                  <h3 className="text-gray-900 font-bold group-hover:text-pink-600 transition-colors">{creator.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <PlatformBadge platform={creator.platform} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-center">
                  {[["Subscribers", creator.subscribers], ["Videos", creator.videoCount]].map(([label, val], j) => (
                    <div key={j}>
                      <div className="text-gray-900 font-extrabold text-sm">{val}</div>
                      <div className="text-gray-400 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setTrackedCreators(prev => prev.filter(c => c.id !== creator.id)); }} className="text-gray-300 hover:text-red-400 p-2 rounded-lg hover:bg-gray-50"><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">=e</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No creators tracked yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">Add creators by pasting their YouTube channel URL or searching by name above. You can also find creators on the Discover page.</p>
        </div>
      )}
    </div>
  );
};

const ScriptWriterPage = ({ pageState, setPageState }) => {
  const [mode, setMode] = useState(pageState?.remixTranscript ? "remix" : "idea");
  const [input, setInput] = useState(pageState?.remixTranscript || "");
  const [generatedScript, setGeneratedScript] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState("Short (15-30s)");
  const [tone, setTone] = useState("Energetic");

  const generate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedScript(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, duration, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setGeneratedScript(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Script Writer</h1>
        <p className="text-gray-500 mt-1">Generate scroll-stopping short-form scripts in seconds.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: "remix", label: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ Remix Reel", desc: "Paste a viral reel transcript to rewrite" },
          { key: "idea", label: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ From Idea", desc: "Turn a single idea into a full script" },
          { key: "outline", label: "ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ From Outline", desc: "Expand an outline into a polished script" },
          { key: "polish", label: "ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ¨ Polish Draft", desc: "Refine and improve an existing draft" },
        ].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); setGeneratedScript(null); }} className={`p-4 rounded-2xl border-2 text-left transition-all ${mode === m.key ? "border-pink-400 bg-pink-50 shadow-sm" : "border-gray-200 bg-white hover:border-pink-200"}`}>
            <div className="font-bold text-sm text-gray-900">{m.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "remix" ? "Paste the transcript of a viral reel you want to remix..." : mode === "idea" ? "Type your video idea... (e.g., 'Why most people will never be rich')" : mode === "outline" ? "Paste your outline here..." : "Paste your draft to polish..."} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-32" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300">
              <option>Short (15-30s)</option>
              <option>Medium (30-45s)</option>
              <option>Long (45-60s)</option>
            </select>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300">
              <option>Energetic</option>
              <option>Conversational</option>
              <option>Professional</option>
              <option>Storytelling</option>
            </select>
          </div>
          <button onClick={generate} disabled={isGenerating || !input.trim()} className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
            {isGenerating ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Script</>}
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
      </div>
      {generatedScript && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-pink-500" /> Your Script</h2>
            <div className="flex gap-2">
              <button onClick={() => { const full = [generatedScript.hook, generatedScript.explain, generatedScript.illustrate, generatedScript.teach].filter(Boolean).join("\n\n"); navigator.clipboard.writeText(full); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50" title="Copy full script"><Copy size={14} /></button>
              <button onClick={generate} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50" title="Regenerate"><RefreshCw size={14} /></button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-4">
              <div className="text-xs font-bold text-orange-600 mb-1">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ£ HOOK</div>
              <p className="text-gray-900 font-medium">{generatedScript.hook}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-xs font-bold text-blue-600 mb-1">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ EXPLAIN</div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{generatedScript.explain}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="text-xs font-bold text-purple-600 mb-1">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¡ ILLUSTRATE</div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{generatedScript.illustrate}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-600 mb-1">ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ TEACH</div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{generatedScript.teach}</p>
            </div>
          </div>
          {mode === "remix" && generatedScript.analysis && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h3 className="font-bold text-sm text-gray-700">Remix Analysis</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-gray-600 text-sm leading-relaxed">{generatedScript.analysis}</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                {generatedScript.original_word_count > 0 && <span>Original: {generatedScript.original_word_count} words</span>}
                {generatedScript.rewritten_word_count > 0 && <span>Rewritten: {generatedScript.rewritten_word_count} words</span>}
              </div>
              {generatedScript.used_research && (
                <div className="text-xs text-gray-500 italic">{generatedScript.used_research}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HooksPage = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [generatedHooks, setGeneratedHooks] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateCustomHooks = async () => {
    if (!customTopic.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedHooks(null);
    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setGeneratedHooks(data.hooks);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Hook Generator</h1>
        <p className="text-gray-500 mt-1">Create scroll-stopping opening lines for your short-form videos.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">Generate hooks for any topic</h2>
        <div className="flex gap-3">
          <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Enter your topic... (e.g., 'morning routines', 'investing')" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300" onKeyDown={(e) => e.key === "Enter" && generateCustomHooks()} />
          <button onClick={generateCustomHooks} disabled={isGenerating || !customTopic} className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
            {isGenerating ? <><RefreshCw size={14} className="animate-spin" /> Working...</> : <><Zap size={14} /> Generate</>}
          </button>
        </div>
        {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
        {generatedHooks && (
          <div className="mt-4 space-y-2">
            {generatedHooks.map((hook, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 group hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                <p className="text-gray-700 text-sm flex-1">"{hook}"</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-gray-400 hover:text-pink-500 p-1.5 rounded-lg hover:bg-white"><Copy size={13} /></button>
                  <button className="text-gray-400 hover:text-orange-500 p-1.5 rounded-lg hover:bg-white"><Bookmark size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Hook Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {HOOK_TEMPLATES.map((template, i) => (
            <div key={i} onClick={() => setSelectedType(selectedType === i ? null : i)} className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all ${selectedType === i ? "border-pink-400 shadow-md" : "border-gray-100 hover:border-pink-200 hover:shadow-sm"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><span className="text-xl">{template.icon}</span> {template.type}</h3>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${selectedType === i ? "rotate-180 text-pink-500" : ""}`} />
              </div>
              {selectedType === i && (
                <div className="space-y-2 mt-3">
                  {template.hooks.map((hook, j) => (
                    <div key={j} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-2 group">
                      <p className="text-gray-600 text-sm">"{hook}"</p>
                      <button className="text-gray-300 hover:text-pink-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VaultPage = () => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? VAULT_ITEMS : VAULT_ITEMS.filter(item => item.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Content Vault</h1>
          <p className="text-gray-500 mt-1">Your saved hooks, styles, and frameworks ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ready to use anytime.</p>
        </div>
        <button className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md">
          <Plus size={16} /> Add to Vault
        </button>
      </div>
      <div className="flex gap-2">
        {[{ key: "all", label: "All" }, { key: "hook", label: "Hooks" }, { key: "style", label: "Styles" }, { key: "structure", label: "Structures" }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === f.key ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-500 hover:border-pink-200"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-pink-100 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.type === "hook" ? "bg-pink-100 text-pink-600" : item.type === "style" ? "bg-cyan-100 text-cyan-600" : "bg-amber-100 text-amber-600"}`}>{item.type}</span>
                  <span className="text-xs text-gray-400">from {item.source}</span>
                  <span className="text-xs text-gray-300">ÃÂÃÂÃÂÃÂ· {item.saved}</span>
                </div>
                <p className="text-gray-700 text-sm">{item.content}</p>
                <div className="flex gap-2 mt-2">
                  {item.tags.map((tag, j) => (
                    <span key={j} className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="text-gray-300 hover:text-pink-500 p-2 rounded-lg hover:bg-gray-50"><Copy size={14} /></button>
                <button className="text-gray-300 hover:text-red-400 p-2 rounded-lg hover:bg-gray-50"><X size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900">Settings</h1>
      <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-gray-900">Profile</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500 block mb-1.5 font-medium">Name</label>
          <input type="text" defaultValue="Michael" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>
        <div>
          <label className="text-sm text-gray-500 block mb-1.5 font-medium">Email</label>
          <input type="email" defaultValue="michaelreadartofficial@gmail.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-gray-900">Subscription</h2>
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-pink-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-gray-900 font-extrabold text-lg">Pro Plan</div>
          <div className="text-gray-500 text-sm">50 creators ÃÂÃÂÃÂÃÂ· Unlimited saves ÃÂÃÂÃÂÃÂ· Full access to all tools</div>
        </div>
        <div className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text" style={{ WebkitTextFillColor: "transparent" }}>$39/mo</div>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-gray-900">Platforms</h2>
      <div className="space-y-3">
        {["TikTok", "Instagram Reels", "YouTube Shorts"].map((platform, i) => (
          <label key={i} className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <PlatformBadge platform={platform} />
              <span className="text-gray-600 text-sm">Show {platform} content</span>
            </div>
            <div className="w-11 h-6 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full relative shadow-sm">
              <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </label>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "videos", label: "Discover", icon: Video },
  { key: "channels", label: "Creators", icon: Users },
  { key: "hooks", label: "Hooks", icon: Zap },
  { key: "scripts", label: "Script Writer", icon: PenTool },
  { key: "vault", label: "Vault", icon: Archive },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [pageState, setPageState] = useState({});

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage setPage={setPage} />;
      case "videos": return <DiscoverPage setPage={setPage} setSelectedCreator={setSelectedCreator} />;
      case "creator-detail": return <CreatorDetailPage creator={selectedCreator} setPage={setPage} setPageState={setPageState} />;
      case "channels": return <ChannelsPage setPage={setPage} setSelectedCreator={setSelectedCreator} />;
      case "hooks": return <HooksPage />;
      case "scripts": return <ScriptWriterPage pageState={pageState} setPageState={setPageState} />;
      case "vault": return <VaultPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardPage setPage={setPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-60"}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-lg">O</div>
          {!sidebarCollapsed && <span className="font-extrabold text-gray-900 tracking-tight text-lg">Optimus<span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text" style={{ WebkitTextFillColor: "transparent" }}>.AI</span></span>}
        </div>

        {/* Platforms indicator */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Platforms</div>
            <div className="flex gap-1.5">
              {["TikTok", "Reels", "Shorts"].map(p => (
                <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-semibold">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`} title={sidebarCollapsed ? item.label : undefined}>
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Credits */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-3 border border-pink-100">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Credits</div>
              <div className="text-gray-900 font-extrabold mt-0.5">47 / 100</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 h-1.5 rounded-full" style={{ width: "47%" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
