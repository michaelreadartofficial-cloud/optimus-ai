import { useState, useEffect } from "react";
import { Loader2, Wand2, Check, Sparkles, Copy, Bookmark, RefreshCw, PenTool, Trash2, ChevronDown, Video, X, Pencil } from "lucide-react";
import { ErrorMessage } from "../components/ErrorMessage";
import { apiPost } from "../utils/api";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

export const ScriptsPage = ({ savedVideos }) => {
  const [savedScripts, setSavedScripts] = useState(() => loadFromStorage(STORAGE_KEYS.savedScripts, []));
  const [activeTab, setActiveTab] = useState("remix");

  // Remix tab state — the seed is populated when the user clicks "Remix
  // this script" on a video modal. That handler stores a payload in
  // localStorage under optimus_remix_seed, which we pick up on mount.
  const [remixSeed, setRemixSeed] = useState(() => loadFromStorage("optimus_remix_seed", null));
  const [remixFramework, setRemixFramework] = useState("");
  const [remixShowFrameworkDrop, setRemixShowFrameworkDrop] = useState(false);
  const [remixCustomPrompt, setRemixCustomPrompt] = useState("");
  const [remixing, setRemixing] = useState(false);
  const [remixError, setRemixError] = useState(null);
  const [remixedScript, setRemixedScript] = useState(null);
  // Edit mode for the remix output card — swaps <pre> for a <textarea>
  // so the user can tweak the rewritten script in place.
  const [remixEditing, setRemixEditing] = useState(false);
  const [remixEditDraft, setRemixEditDraft] = useState("");
  // Flips true for ~2s after the user clicks Save script, so the button
  // can flash a "Saved!" confirmation.
  const [remixJustSaved, setRemixJustSaved] = useState(false);

  const REMIX_FRAMEWORKS = [
    { key: "heit", label: "HEIT Framework" },
    { key: "bens", label: "Bens Framework" },
    { key: "custom", label: "Custom Framework" },
  ];

  // Poll localStorage on tab focus so if the user opens Remix after the
  // seed was stored by the modal, we pick it up.
  useEffect(() => {
    const onFocus = () => {
      const fresh = loadFromStorage("optimus_remix_seed", null);
      if (fresh && (!remixSeed || fresh.seededAt !== remixSeed.seededAt)) setRemixSeed(fresh);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [remixSeed]);

  // Also pick up the seed when switching to the Remix tab
  useEffect(() => {
    if (activeTab === "remix") {
      const fresh = loadFromStorage("optimus_remix_seed", null);
      if (fresh && (!remixSeed || fresh.seededAt !== remixSeed.seededAt)) setRemixSeed(fresh);
    }
  }, [activeTab]);

  const clearRemixSeed = () => {
    setRemixSeed(null);
    setRemixFramework("");
    setRemixCustomPrompt("");
    setRemixedScript(null);
    setRemixError(null);
    setRemixEditing(false);
    setRemixEditDraft("");
    try { localStorage.removeItem("optimus_remix_seed"); } catch {}
  };

  const runRemix = async () => {
    if (!remixSeed || !remixFramework) return;
    if (remixFramework === "custom" && !remixCustomPrompt.trim()) {
      setRemixError("Add custom framework instructions before running.");
      return;
    }
    setRemixing(true);
    setRemixError(null);
    setRemixedScript(null);
    setRemixEditing(false);
    setRemixEditDraft("");
    try {
      const r = await apiPost("/api/remix-script", {
        seed: remixSeed,
        framework: remixFramework,
        customPrompt: remixFramework === "custom" ? remixCustomPrompt : undefined,
      });
      setRemixedScript({
        framework: remixFramework,
        text: r.text || "",
        wordCount: r.wordCount || null,
      });
    } catch (e) {
      setRemixError(e.message);
    } finally {
      setRemixing(false);
    }
  };

  const [hookTopic, setHookTopic] = useState("");
  const [sourceVideoId, setSourceVideoId] = useState("");
  const [generatedHooks, setGeneratedHooks] = useState([]);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [hookError, setHookError] = useState(null);

  const [pickedHook, setPickedHook] = useState("");
  const [lengthSec, setLengthSec] = useState(60);
  const [generatorTone, setGeneratorTone] = useState("Energetic");
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [genError, setGenError] = useState(null);

  const approxWords = Math.round(lengthSec * 2.7);
  const durationLabel = `${lengthSec}s · ~${approxWords} words`;

  useEffect(() => { saveToStorage(STORAGE_KEYS.savedScripts, savedScripts); }, [savedScripts]);

  const effectiveTopic = () => {
    if (sourceVideoId) {
      const v = savedVideos.find(v => String(v.id) === String(sourceVideoId));
      if (v) return v.title;
    }
    return hookTopic;
  };

  const generateHooks = async () => {
    const topic = effectiveTopic();
    if (!topic.trim()) return;
    setGeneratingHooks(true);
    setHookError(null);
    setGeneratedHooks([]);
    setPickedHook("");
    setGeneratedScript(null);
    try {
      const result = await apiPost("/api/generate-hooks", { topic });
      setGeneratedHooks(result.hooks || []);
    } catch (err) {
      setHookError(err.message || "Failed to generate hooks");
    } finally {
      setGeneratingHooks(false);
    }
  };

  const generateScript = async () => {
    if (!pickedHook.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedScript(null);
    try {
      const topic = effectiveTopic() || pickedHook;
      const result = await apiPost("/api/generate-script", {
        mode: "idea",
        input: `Hook: "${pickedHook}". Topic: ${topic}. Write a ${lengthSec}-second (~${approxWords} words) script that starts with this exact hook, then delivers value in the body, and ends with a strong CTA.`,
        duration: `${lengthSec} seconds`,
        tone: generatorTone,
      });
      setGeneratedScript(result);
    } catch (err) {
      setGenError(err.message || "Failed to generate script");
    } finally {
      setGenerating(false);
    }
  };

  const saveScript = () => {
    if (!generatedScript) return;
    const script = {
      id: Date.now(),
      ...generatedScript,
      topic: effectiveTopic(),
      hook: generatedScript.hook || pickedHook,
      tone: generatorTone,
      duration: durationLabel,
      createdAt: new Date().toISOString(),
    };
    setSavedScripts(prev => [script, ...prev]);
  };

  const resetFlow = () => {
    setHookTopic(""); setSourceVideoId(""); setGeneratedHooks([]);
    setPickedHook(""); setGeneratedScript(null); setHookError(null); setGenError(null);
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scripts</h1>
        <p className="text-sm text-gray-500 mt-1">Turn any idea into a winning short-form script using data-backed storytelling</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: "remix", label: "Remix" },
          { key: "create", label: "Create New Script" },
          { key: "saved", label: `Saved Scripts${savedScripts.length ? ` (${savedScripts.length})` : ""}` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "remix" && !remixSeed && (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
          <PenTool size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No video selected</p>
          <p className="text-xs text-gray-500 mt-1 mb-1">Go to the Videos tab, click a video, and hit "Remix this script" in its detail window. The transcript will load here automatically.</p>
        </div>
      )}

      {activeTab === "remix" && remixSeed && (
        <div className="space-y-5">
          {/* Step 1 — source video summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              {remixSeed.thumbnail && (
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={remixSeed.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{remixSeed.title || "Instagram Reel"}</h3>
                  <button onClick={clearRemixSeed}
                    title="Clear seed — pick a different video"
                    className="p-1 -mr-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
                {remixSeed.channel?.username && (
                  <p className="text-xs text-gray-500 mb-2">@{remixSeed.channel.username}</p>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Transcript</p>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {remixSeed.transcript || remixSeed.caption || <span className="italic text-gray-400">No transcript captured — the original video had no audio transcription or caption available.</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 — choose remix style */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Choose remix style</label>
              <div className="relative">
                <button onClick={() => setRemixShowFrameworkDrop(!remixShowFrameworkDrop)}
                  className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 flex items-center justify-between">
                  <span className={remixFramework ? "text-gray-900" : "text-gray-400"}>
                    {remixFramework ? REMIX_FRAMEWORKS.find(f => f.key === remixFramework)?.label : "Pick a framework"}
                  </span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {remixShowFrameworkDrop && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setRemixShowFrameworkDrop(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                      {REMIX_FRAMEWORKS.map(f => (
                        <button key={f.key}
                          onClick={() => { setRemixFramework(f.key); setRemixShowFrameworkDrop(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${remixFramework === f.key ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {remixFramework === "custom" && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Custom framework instructions</label>
                <textarea rows={4} value={remixCustomPrompt} onChange={(e) => setRemixCustomPrompt(e.target.value)}
                  placeholder="Describe the structure / tone / rules you want this script rewritten with..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}

            <button onClick={runRemix}
              disabled={remixing || !remixFramework || (remixFramework === "custom" && !remixCustomPrompt.trim())}
              className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {remixing ? <><Loader2 size={14} className="animate-spin" /> Remixing…</> : <><Sparkles size={14} /> Remix script</>}
            </button>
            {remixError && <ErrorMessage message={remixError} onRetry={runRemix} />}
          </div>

          {/* Step 3 — remixed output */}
          {remixedScript && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your remixed script</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {REMIX_FRAMEWORKS.find(f => f.key === remixedScript.framework)?.label}
                    {remixedScript.wordCount && (
                      <> · {remixedScript.wordCount.remix} words (original: {remixedScript.wordCount.original})</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {remixEditing ? (
                    <>
                      <button onClick={() => {
                        // Commit the draft back to the remixed script
                        setRemixedScript(prev => prev ? { ...prev, text: remixEditDraft } : prev);
                        setRemixEditing(false);
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                        <Check size={12} /> Done
                      </button>
                      <button onClick={() => {
                        setRemixEditing(false);
                        setRemixEditDraft("");
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <X size={12} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyToClipboard(remixedScript.text || "")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Copy size={12} /> Copy
                      </button>
                      <button onClick={() => {
                        setRemixEditDraft(remixedScript.text || "");
                        setRemixEditing(true);
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Pencil size={12} /> Edit this script
                      </button>
                      <button onClick={() => {
                        const s = {
                          id: Date.now(),
                          topic: remixSeed.title,
                          hook: "",
                          body: remixedScript.text,
                          cta: "",
                          tone: "Remix",
                          duration: REMIX_FRAMEWORKS.find(f => f.key === remixedScript.framework)?.label,
                          createdAt: new Date().toISOString(),
                        };
                        setSavedScripts(prev => [s, ...prev]);
                        setRemixJustSaved(true);
                        setTimeout(() => setRemixJustSaved(false), 2000);
                      }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition ${
                          remixJustSaved
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}>
                        {remixJustSaved ? <><Check size={12} /> Saved!</> : <><Bookmark size={12} /> Save script</>}
                      </button>
                      <button onClick={() => { setRemixedScript(null); setRemixEditing(false); setRemixEditDraft(""); setRemixJustSaved(false); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RefreshCw size={12} /> Start over
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {remixEditing ? (
                  <textarea
                    value={remixEditDraft}
                    onChange={(e) => setRemixEditDraft(e.target.value)}
                    className="w-full min-h-[400px] text-sm text-gray-900 leading-relaxed font-sans p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                    placeholder="Edit your rewritten script…"
                    autoFocus
                  />
                ) : (
                  <pre className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-sans">{remixedScript.text}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-sm font-semibold text-gray-900">Start with a topic or a saved video</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Topic</label>
                <input type="text" value={hookTopic}
                  onChange={(e) => { setHookTopic(e.target.value); if (e.target.value) setSourceVideoId(""); }}
                  onKeyDown={(e) => e.key === "Enter" && generateHooks()}
                  placeholder="e.g. why most workouts don't work"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Or start from a saved video</label>
                <select value={sourceVideoId}
                  onChange={(e) => { setSourceVideoId(e.target.value); if (e.target.value) setHookTopic(""); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">— pick a saved video —</option>
                  {savedVideos.map(v => (
                    <option key={v.id} value={v.id}>{(v.title || "").slice(0, 60)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={generateHooks} disabled={generatingHooks || !effectiveTopic().trim()}
              className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {generatingHooks ? <><Loader2 size={14} className="animate-spin" /> Generating hooks…</> : <><Wand2 size={14} /> Generate hooks</>}
            </button>
            {hookError && <ErrorMessage message={hookError} onRetry={generateHooks} />}
          </div>

          {generatedHooks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h3 className="text-sm font-semibold text-gray-900">Pick your favorite hook</h3>
              </div>
              <div className="space-y-2">
                {generatedHooks.map((hook, i) => (
                  <button key={i} onClick={() => setPickedHook(hook)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition ${
                      pickedHook === hook ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      pickedHook === hook ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"
                    }`}>{i + 1}</span>
                    <span className="text-sm text-gray-900 flex-1">{hook}</span>
                    {pickedHook === hook && <Check size={14} className="text-gray-900 flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pickedHook && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h3 className="text-sm font-semibold text-gray-900">Change the length of the script</h3>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">{lengthSec} seconds</label>
                  <span className="text-xs text-gray-400">Approximately {approxWords} words</span>
                </div>
                <input type="range" min="15" max="180" step="15" value={lengthSec}
                  onChange={(e) => setLengthSec(parseInt(e.target.value))}
                  className="w-full accent-gray-900" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>15s</span><span>60s</span><span>120s</span><span>180s</span>
                </div>
              </div>
              <div>
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
              <button onClick={generateScript} disabled={generating}
                className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {generating ? <><Loader2 size={14} className="animate-spin" /> Writing script…</> : <><Sparkles size={14} /> Write the script</>}
              </button>
              {genError && <ErrorMessage message={genError} onRetry={generateScript} />}
            </div>
          )}

          {generatedScript && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your script</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{durationLabel} · {generatorTone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(`${generatedScript.hook || pickedHook}\n\n${generatedScript.body || ""}\n\n${generatedScript.cta || ""}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Copy size={12} /> Copy
                  </button>
                  <button onClick={saveScript}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <Bookmark size={12} /> Save
                  </button>
                  <button onClick={resetFlow}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RefreshCw size={12} /> Start over
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Hook</p>
                  <p className="text-sm text-gray-900">{generatedScript.hook || pickedHook}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Body</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{generatedScript.body}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Call to Action</p>
                  <p className="text-sm text-gray-900">{generatedScript.cta}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedScripts.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
              <PenTool size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No saved scripts yet</p>
              <p className="text-xs text-gray-500 mt-1">Generate a script and save it to see it here</p>
            </div>
          )}
          {savedScripts.map(script => (
            <div key={script.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{script.topic || script.hook}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{script.tone} · {script.duration}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
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
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Hook</p>
                  <p className="text-sm text-gray-900">{script.hook}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Body</p>
                  <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{script.body}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">CTA</p>
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
