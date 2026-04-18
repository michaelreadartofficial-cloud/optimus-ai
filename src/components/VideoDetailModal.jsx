import { useState } from "react";
import {
  TrendingUp, Eye, Heart, MessageCircle, Flame, X, Play, Bookmark,
  PenTool, ExternalLink, Sparkles, Loader2,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { apiPost } from "../utils/api";
import { formatNumber, timeAgo, getYouTubeEmbedId } from "../utils/format";

export const VideoDetailModal = ({ video, onClose, onSaveToggle, isSaved, setCurrentPage }) => {
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
