import { useState, useEffect } from "react";
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
  // Flips true while the "Remix this script" button is async-fetching
  // the transcript before navigating to the Scripts page. Without this
  // the button looked inert while a ~5–15s Whisper call ran.
  const [remixing, setRemixing] = useState(false);

  // Reset analysis state whenever the modal opens with a different video.
  // Without this the stale transcript/hook/whyViral from the previous video
  // would render briefly (and sometimes persist, if the new video has
  // nothing cached) — making it look like video B got video A's transcript.
  useEffect(() => {
    setAnalysis({ hook: null, transcript: null, whyViral: null });
    setAnalyzing({ hook: false, transcript: false, whyViral: false });
    setError(null);
    setActiveTab("hook");
  }, [video?.id, video?.videoUrl]);

  if (!video) return null;

  const ytId = getYouTubeEmbedId(video.url);
  const platformUrl = video.url || "#";

  // Cache key is namespaced by BOTH id and shortcode (when available) so two
  // different reels that somehow share a numeric id can't share cache entries.
  // Falls back to id if shortcode is missing.
  const CACHE_KEY = "optimus_video_analysis_cache";
  const cacheKeyFor = () => String(video.shortcode || video.id || "");
  const readCache = (kind) => {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return all?.[cacheKeyFor()]?.[kind] || null;
    } catch { return null; }
  };
  const writeCache = (kind, text) => {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      const k = cacheKeyFor();
      if (!all[k]) all[k] = {};
      all[k][kind] = text;
      localStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch {}
  };

  const runAnalysis = async (kind) => {
    setError(null);
    // Check cache first
    const cached = readCache(kind);
    if (cached) {
      setAnalysis(p => ({ ...p, [kind]: cached }));
      return;
    }
    setAnalyzing(p => ({ ...p, [kind]: true }));
    try {
      const r = await apiPost("/api/video-analysis", { video, kind });
      const text = r.text || "No analysis returned.";
      setAnalysis(p => ({ ...p, [kind]: text }));
      writeCache(kind, text);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(p => ({ ...p, [kind]: false }));
    }
  };

  const stats = [
    video.outlierScore >= 1 && { icon: TrendingUp, label: "Outlier", value: `${video.outlierScore.toFixed(1)}x`, color: "text-red-500" },
    { icon: Eye, label: "Views", value: video.viewsFormatted || formatNumber(video.views), color: "text-gray-700" },
    video.likes != null && { icon: Heart, label: "Likes", value: formatNumber(video.likes), color: "text-gray-700" },
    video.comments != null && { icon: MessageCircle, label: "Comments", value: formatNumber(video.comments), color: "text-gray-700" },
    video.engagementRate != null && { icon: Flame, label: "Engagement", value: `${(video.engagementRate * 100).toFixed(1)}%`, color: "text-gray-700" },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="md:w-[340px] flex-shrink-0 bg-gray-950 relative">
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 md:hidden p-1.5 rounded-full bg-white/90 hover:bg-white transition">
            <X size={16} className="text-gray-700" />
          </button>
          {/* Aspect-ratio 9:16 for the video. On mobile we cap the
              height so the tall reel doesn't push stats/tabs below out
              of reach — aspect-ratio + max-height makes the browser
              shrink width to preserve the 9:16 ratio. */}
          <div className="relative w-full mx-auto aspect-[9/16] max-h-[55vh] md:max-h-none">
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

        <div className="flex-1 min-w-0 flex flex-col md:max-h-[90vh]">
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
            <button
              disabled={remixing}
              onClick={async () => {
                if (remixing) return;
                setRemixing(true);
                // Persist the seed for the Scripts > Remix tab. If we already
                // have a cached transcript for this video, use it; otherwise
                // fetch one now so Remix opens with the real transcript.
                let transcript = (analysis.transcript || "").trim();
                if (!transcript) {
                  try {
                    const r = await apiPost("/api/video-analysis", { video, kind: "transcript" });
                    transcript = (r.text || "").trim();
                  } catch {}
                }
                try {
                  localStorage.setItem("optimus_remix_seed", JSON.stringify({
                    videoId: video.id,
                    title: video.title || "",
                    caption: video.caption || "",
                    transcript,
                    thumbnail: video.thumbnail || "",
                    channel: video.channel || {},
                    url: video.url || "",
                    views: video.views || 0,
                    outlierScore: video.outlierScore || 0,
                    seededAt: Date.now(),
                  }));
                } catch {}
                // Also save to vault for user convenience
                if (!isSaved) onSaveToggle(video);
                setCurrentPage("scripts");
                setRemixing(false);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-70 disabled:cursor-wait">
              {remixing ? (
                <><Loader2 size={13} className="animate-spin" /> Transcribing…</>
              ) : (
                <><PenTool size={13} /> Remix this script</>
              )}
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

          <div className="flex-1 md:overflow-y-auto px-5 py-4 text-sm text-gray-700 leading-relaxed">
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
                <p className="text-xs text-gray-500 mb-3 max-w-md mx-auto">
                  {activeTab === "hook" && "Break down the opening hook — what pattern, what tension."}
                  {activeTab === "transcript" && "Transcribe the spoken words using OpenAI Whisper. Falls back to the creator's caption if transcription isn't available."}
                  {activeTab === "whyViral" && "Get the format, emotional driver, and replicable tactic."}
                </p>
                <button onClick={() => runAnalysis(activeTab)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition">
                  <Sparkles size={12} /> {activeTab === "transcript" ? "Get transcript" : "Analyze with AI"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
