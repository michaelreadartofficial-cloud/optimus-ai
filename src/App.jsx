import { useState } from "react";
import { Search, TrendingUp, Zap, BookOpen, Archive, Settings, Eye, ThumbsUp, MessageCircle, Clock, Star, Copy, ChevronDown, Plus, Sparkles, RefreshCw, X, BarChart3, Users, Video, Bookmark, Flame, ArrowRight, Lightbulb, PenTool, Layers, Play } from "lucide-react";

// ============================================================
// SAMPLE DATA — Short-Form Only (TikTok, Reels, Shorts)
// ============================================================

const SAMPLE_VIDEOS = [
  { id: 1, title: "I Tried Living on $1 for 24 Hours", channel: "Ryan Trahan", platform: "YouTube Shorts", views: "48.2M", likes: "2.1M", comments: "45K", outlierScore: 28.5, uploadDate: "3 days ago", duration: "0:58", emoji: "🎬", niche: "Lifestyle", hook: "What if I told you that you could survive an entire day on just one dollar?", transcript: "What if I told you that you could survive an entire day on just one dollar? Most people think it's impossible, but I'm about to prove them wrong. First stop — the dollar store..." },
  { id: 2, title: "This Trick Makes You Sound Smarter Instantly", channel: "Jade Bowler", platform: "TikTok", views: "12.7M", likes: "890K", comments: "23K", outlierScore: 15.2, uploadDate: "1 week ago", duration: "0:34", emoji: "🧠", niche: "Education", hook: "Stop using the word 'very'. Here's what smart people say instead.", transcript: "Stop using the word 'very'. Here's what smart people say instead. Instead of 'very tired', say 'exhausted'. Instead of 'very happy', say 'ecstatic'..." },
  { id: 3, title: "POV: You Finally Quit Your 9-5", channel: "Alex Hormozi", platform: "Instagram Reels", views: "8.4M", likes: "620K", comments: "18K", outlierScore: 12.8, uploadDate: "5 days ago", duration: "0:45", emoji: "💼", niche: "Business", hook: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next.", transcript: "Everyone told me I was crazy for quitting my six-figure job. Here's what happened next. Month one — I made zero dollars. Month two — still zero..." },
  { id: 4, title: "The Psychology Behind Why You Can't Stop Scrolling", channel: "Ali Abdaal", platform: "YouTube Shorts", views: "22.1M", likes: "1.5M", comments: "34K", outlierScore: 19.3, uploadDate: "2 days ago", duration: "0:52", emoji: "📱", niche: "Psychology", hook: "Your phone is literally designed to be addictive. Here's the science behind it.", transcript: "Your phone is literally designed to be addictive. Here's the science behind it. It's called variable ratio reinforcement — the same psychology behind slot machines..." },
  { id: 5, title: "I Asked 100 Millionaires Their #1 Habit", channel: "Mark Tilbury", platform: "TikTok", views: "31.5M", likes: "1.8M", comments: "52K", outlierScore: 24.1, uploadDate: "4 days ago", duration: "0:41", emoji: "💰", niche: "Finance", hook: "I spent 6 months interviewing 100 millionaires and they all said the same thing.", transcript: "I spent 6 months interviewing 100 millionaires and they all said the same thing. It wasn't waking up at 5am. It wasn't cold showers. It was this one simple habit..." },
  { id: 6, title: "Why Japan's Trains Are Never Late", channel: "Abroad in Japan", platform: "Instagram Reels", views: "15.8M", likes: "1.1M", comments: "28K", outlierScore: 16.7, uploadDate: "1 week ago", duration: "0:55", emoji: "🚄", niche: "Travel", hook: "In Japan, if a train is even 60 seconds late, the company issues a formal apology.", transcript: "In Japan, if a train is even 60 seconds late, the company issues a formal apology. But how do they maintain this insane level of punctuality? It comes down to three things..." },
  { id: 7, title: "This Meal Prep Changed My Life (5 Mins)", channel: "Ethan Chlebowski", platform: "TikTok", views: "9.6M", likes: "740K", comments: "21K", outlierScore: 11.4, uploadDate: "6 days ago", duration: "0:48", emoji: "🍳", niche: "Food", hook: "This 5-minute meal prep will save you $200 a month. And it actually tastes good.", transcript: "This 5-minute meal prep will save you $200 a month. And it actually tastes good. All you need are five ingredients..." },
  { id: 8, title: "The Real Reason You're Always Tired", channel: "Dr. Mike", platform: "YouTube Shorts", views: "19.3M", likes: "1.3M", comments: "41K", outlierScore: 17.9, uploadDate: "3 days ago", duration: "0:39", emoji: "😴", niche: "Health", hook: "You're not tired because you're not sleeping enough. You're tired because of this.", transcript: "You're not tired because you're not sleeping enough. You're tired because of this. Most people don't realize that chronic fatigue comes from three hidden causes..." },
];

const SAMPLE_CHANNELS = [
  { name: "Ryan Trahan", platform: "YouTube Shorts", subscribers: "12.4M", avgViews: "5.2M", videos: 342, niche: "Lifestyle", emoji: "🎬" },
  { name: "Ali Abdaal", platform: "YouTube Shorts", subscribers: "5.8M", avgViews: "1.8M", videos: 520, niche: "Productivity", emoji: "📚" },
  { name: "Alex Hormozi", platform: "Instagram Reels", subscribers: "3.2M", avgViews: "2.1M", videos: 890, niche: "Business", emoji: "💪" },
  { name: "Mark Tilbury", platform: "TikTok", subscribers: "8.1M", avgViews: "3.5M", videos: 1200, niche: "Finance", emoji: "💰" },
  { name: "Dr. Mike", platform: "TikTok", subscribers: "11.2M", avgViews: "4.1M", videos: 650, niche: "Health", emoji: "🩺" },
  { name: "Jade Bowler", platform: "YouTube Shorts", subscribers: "1.9M", avgViews: "800K", videos: 280, niche: "Education", emoji: "🧠" },
];

const HOOK_TEMPLATES = [
  { type: "Question", icon: "❓", hooks: ["What if I told you [unexpected claim]?", "Did you know that [shocking statistic]?", "Why does nobody talk about [hidden truth]?", "Have you ever wondered why [common thing] works this way?"] },
  { type: "Controversy", icon: "🔥", hooks: ["Everyone is wrong about [topic]. Here's the truth.", "[Popular advice] is actually ruining your [area].", "I'm going to say something that might upset a lot of people.", "Stop doing [common habit]. It's destroying your [result]."] },
  { type: "Story", icon: "📖", hooks: ["I spent [time] doing [extreme thing]. Here's what happened.", "Nobody believed me when I said [claim]. Then this happened.", "Last week, something changed my mind completely about [topic].", "Three years ago I was [bad situation]. Today I [good outcome]."] },
  { type: "Statistic", icon: "📊", hooks: ["[X]% of people don't know this about [topic].", "I analyzed [large number] of [things] and found this pattern.", "According to [source], [surprising finding].", "Only [small number] of people will ever [achievement]. Here's why."] },
];

const VAULT_ITEMS = [
  { id: 1, type: "hook", content: "What if I told you that everything you know about [topic] is wrong?", source: "Ryan Trahan", tags: ["question", "curiosity gap"], saved: "2 days ago" },
  { id: 2, type: "style", content: "Fast-paced cuts with text overlays, jump cuts every 2-3 seconds, high energy voiceover", source: "Ali Abdaal", tags: ["editing", "pacing"], saved: "1 week ago" },
  { id: 3, type: "hook", content: "I spent $10,000 testing this so you don't have to.", source: "Mark Tilbury", tags: ["story", "investment"], saved: "3 days ago" },
  { id: 4, type: "structure", content: "Hook (3s) → Context (5s) → 3 Key Points (20s) → Twist (5s) → CTA (3s)", source: "Jade Bowler", tags: ["framework", "short-form"], saved: "5 days ago" },
];

// ============================================================
// SMALL REUSABLE PIECES
// ============================================================

const platformColors = {
  "YouTube Shorts": { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-500" },
  "TikTok": { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Instagram Reels": { bg: "bg-pink-100", text: "text-pink-600", dot: "bg-pink-500" },
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
      <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, Michael 🚀</h1>
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
      <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">🏆 Top Outlier Today</h2>
      <div className="mt-3 flex items-start gap-4">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">{SAMPLE_VIDEOS[0].emoji}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{SAMPLE_VIDEOS[0].title}</h3>
          <p className="text-white/70 text-sm mt-1">{SAMPLE_VIDEOS[0].channel} · {SAMPLE_VIDEOS[0].views} views · {SAMPLE_VIDEOS[0].outlierScore}x outlier</p>
          <button onClick={() => setPage("videos")} className="mt-3 bg-white text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-1">
            View analysis <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>

    {/* Trending */}
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">🔥 Trending Short-Form Outliers</h2>
      <div className="grid gap-3">
        {SAMPLE_VIDEOS.slice(0, 5).map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => setPage("videos")}>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{v.emoji}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 text-sm font-semibold truncate group-hover:text-pink-600 transition-colors">{v.title}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{v.channel} · {v.platform}</p>
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

const VideosPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [sortBy, setSortBy] = useState("outlierScore");

  const filtered = SAMPLE_VIDEOS
    .filter(v => platformFilter === "All" || v.platform === platformFilter)
    .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()) || v.channel.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === "outlierScore" ? b.outlierScore - a.outlierScore : parseFloat(b.views) - parseFloat(a.views));

  if (selectedVideo) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedVideo(null)} className="text-sm text-gray-400 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">← Back to videos</button>
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center text-4xl">{selectedVideo.emoji}</div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{selectedVideo.title}</h1>
            <p className="text-gray-500 mt-1">{selectedVideo.channel} · {selectedVideo.uploadDate}</p>
            <div className="flex items-center gap-2 mt-2">
              <OutlierBadge score={selectedVideo.outlierScore} />
              <PlatformBadge platform={selectedVideo.platform} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Eye, label: "Views", value: selectedVideo.views, color: "text-blue-500 bg-blue-50" },
            { icon: ThumbsUp, label: "Likes", value: selectedVideo.likes, color: "text-green-500 bg-green-50" },
            { icon: MessageCircle, label: "Comments", value: selectedVideo.comments, color: "text-purple-500 bg-purple-50" },
            { icon: Clock, label: "Duration", value: selectedVideo.duration, color: "text-orange-500 bg-orange-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}><s.icon size={16} /></div>
              <div className="text-lg font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Zap size={16} className="text-orange-500" /> Hook Analysis</h2>
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-5 border border-orange-100">
            <p className="text-pink-700 italic text-lg font-medium">"{selectedVideo.hook}"</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[["Hook Type", "Curiosity Gap"], ["Emotional Trigger", "Surprise + FOMO"], ["Hook Length", `${selectedVideo.hook.split(" ").length} words`]].map(([label, val], i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-bold text-gray-900">{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><BookOpen size={16} className="text-blue-500" /> Transcript</h2>
          <p className="text-gray-600 leading-relaxed">{selectedVideo.transcript}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><Layers size={16} className="text-purple-500" /> Story Structure</h2>
          <div className="space-y-3">
            {[
              { step: "Hook", desc: "Grabs attention in the first 1-3 seconds", color: "from-orange-400 to-pink-500" },
              { step: "Context", desc: "Sets up the premise and builds curiosity", color: "from-pink-400 to-purple-500" },
              { step: "Body", desc: "Delivers key points with escalating tension", color: "from-purple-400 to-indigo-500" },
              { step: "Twist", desc: "Unexpected reveal or payoff moment", color: "from-indigo-400 to-blue-500" },
              { step: "CTA", desc: "Drives action — follow, comment, or share", color: "from-blue-400 to-cyan-500" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{i + 1}</div>
                <div>
                  <span className="font-semibold text-gray-900 text-sm">{s.step}</span>
                  <span className="text-gray-400 text-sm"> — {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Discover Viral Shorts</h1>
        <p className="text-gray-500 mt-1">Find short-form outliers across TikTok, Reels, and Shorts.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search videos or creators..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all shadow-sm" />
        </div>
        {["All", "TikTok", "YouTube Shorts", "Instagram Reels"].map(p => (
          <button key={p} onClick={() => setPlatformFilter(p)} className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${platformFilter === p ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-pink-200"}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map(video => (
          <div key={video.id} onClick={() => setSelectedVideo(video)} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-pink-200 transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{video.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-gray-900 font-bold text-sm group-hover:text-pink-600 transition-colors">{video.title}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{video.channel} · {video.uploadDate} · {video.duration}</p>
                  </div>
                  <OutlierBadge score={video.outlierScore} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <PlatformBadge platform={video.platform} />
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={11} /> {video.views}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><ThumbsUp size={11} /> {video.likes}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><MessageCircle size={11} /> {video.comments}</span>
                </div>
                <p className="text-gray-500 text-xs mt-2 italic">"{video.hook.substring(0, 85)}..."</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChannelsPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Tracked Creators</h1>
          <p className="text-gray-500 mt-1">Monitor short-form creators and spot their viral patterns.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
          <Plus size={16} /> Add Creator
        </button>
      </div>
      {showAdd && (
        <div className="bg-white border border-pink-200 rounded-2xl p-4 flex gap-3 shadow-sm">
          <input type="text" placeholder="Paste a TikTok, Reels, or Shorts channel URL..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Track</button>
          <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-2.5"><X size={16} /></button>
        </div>
      )}
      <div className="grid gap-3">
        {SAMPLE_CHANNELS.map((ch, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-pink-100 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center text-2xl">{ch.emoji}</div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-bold">{ch.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={ch.platform} />
                  <span className="text-xs text-gray-400 font-medium">{ch.niche}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center">
                {[["Subscribers", ch.subscribers], ["Avg Views", ch.avgViews], ["Videos", ch.videos]].map(([label, val], j) => (
                  <div key={j}>
                    <div className="text-gray-900 font-extrabold text-sm">{val}</div>
                    <div className="text-gray-400 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScriptWriterPage = () => {
  const [mode, setMode] = useState("idea");
  const [input, setInput] = useState("");
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
      <div className="flex gap-3">
        {[
          { key: "idea", label: "💡 From Idea", desc: "Turn a single idea into a full script" },
          { key: "outline", label: "📋 From Outline", desc: "Expand an outline into a polished script" },
          { key: "polish", label: "✨ Polish Draft", desc: "Refine and improve an existing draft" },
        ].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); setGeneratedScript(null); }} className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${mode === m.key ? "border-pink-400 bg-pink-50 shadow-sm" : "border-gray-200 bg-white hover:border-pink-200"}`}>
            <div className="font-bold text-sm text-gray-900">{m.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "idea" ? "Type your video idea... (e.g., 'Why most people will never be rich')" : mode === "outline" ? "Paste your outline here..." : "Paste your draft to polish..."} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-32" />
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
              <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50"><Copy size={14} /></button>
              <button onClick={generate} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50"><RefreshCw size={14} /></button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-4">
              <div className="text-xs font-bold text-orange-600 mb-1">🎣 HOOK</div>
              <p className="text-gray-900 font-medium">{generatedScript.hook}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold text-blue-600 mb-1">📝 BODY</div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{generatedScript.body}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-600 mb-1">📣 CALL TO ACTION</div>
              <p className="text-gray-900 font-medium">{generatedScript.cta}</p>
            </div>
          </div>
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
          <p className="text-gray-500 mt-1">Your saved hooks, styles, and frameworks — ready to use anytime.</p>
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
                  <span className="text-xs text-gray-300">· {item.saved}</span>
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
          <div className="text-gray-500 text-sm">50 creators · Unlimited saves · Full access to all tools</div>
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

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage setPage={setPage} />;
      case "videos": return <VideosPage />;
      case "channels": return <ChannelsPage />;
      case "hooks": return <HooksPage />;
      case "scripts": return <ScriptWriterPage />;
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
