import { useState, useEffect, useRef } from "react";
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
  // Cache of remix outputs keyed by framework — lets the user flip between
  // HEIT / Bens / Custom without regenerating (which would burn credits
  // AND lose the prior script they may still want).
  const [remixOutputs, setRemixOutputs] = useState({});
  // Edit mode for the remix output card — swaps <pre> for a <textarea>
  // so the user can tweak the rewritten script in place.
  const [remixEditing, setRemixEditing] = useState(false);
  const [remixEditDraft, setRemixEditDraft] = useState("");
  // Flips true for ~2s after the user clicks Save script, so the button
  // can flash a "Saved!" confirmation.
  const [remixJustSaved, setRemixJustSaved] = useState(false);
  // Name-script modal for when the user clicks Save script in the Remix
  // output card. Pre-filled with the source reel title but fully editable.
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameModalDraft, setNameModalDraft] = useState("");
  // Which tab is saving — "remix" or "create" — controls which state the
  // modal's save handler pulls from when building the saved script record.
  const [nameModalSource, setNameModalSource] = useState("remix");
  // Full-content view modal for the Saved Scripts tab.
  const [viewingScript, setViewingScript] = useState(null);

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

  // Wipe the output cache and reset state when the seed (source reel)
  // actually changes — otherwise you'd see the previous reel's remix.
  const prevSeedIdRef = useRef(null);
  useEffect(() => {
    const id = remixSeed?.seededAt || null;
    if (prevSeedIdRef.current === id) return;
    prevSeedIdRef.current = id;
    setRemixOutputs({});
    setRemixedScript(null);
    setRemixFramework("");
    setRemixCustomPrompt("");
    setRemixEditing(false);
    setRemixEditDraft("");
    setRemixJustSaved(false);
    setRemixError(null);
  }, [remixSeed?.seededAt]);

  // When the user switches framework tabs, show the cached output for
  // that framework (if any) — do NOT auto-regenerate. If nothing is
  // cached yet for this framework, clear the output card so the Remix
  // button controls regeneration.
  useEffect(() => {
    setRemixEditing(false);
    setRemixEditDraft("");
    setRemixJustSaved(false);
    if (!remixFramework) {
      setRemixedScript(null);
      return;
    }
    const cached = remixOutputs[remixFramework];
    setRemixedScript(cached || null);
  }, [remixFramework]);

  // If the user edits their custom-framework prompt, any cached custom
  // output no longer matches — invalidate it so the next Remix click
  // regenerates against the new prompt.
  const customPromptMountedRef = useRef(false);
  useEffect(() => {
    if (!customPromptMountedRef.current) {
      customPromptMountedRef.current = true;
      return;
    }
    setRemixOutputs(prev => {
      if (!prev.custom) return prev;
      const next = { ...prev };
      delete next.custom;
      return next;
    });
    if (remixFramework === "custom") setRemixedScript(null);
  }, [remixCustomPrompt]);

  const clearRemixSeed = () => {
    setRemixSeed(null);
    setRemixFramework("");
    setRemixCustomPrompt("");
    setRemixedScript(null);
    setRemixOutputs({});
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
    setRemixEditing(false);
    setRemixEditDraft("");
    // Note: we intentionally do NOT clear remixedScript here — keep the
    // existing cached output visible while the new one is generating, so
    // the card doesn't flash empty mid-request.
    try {
      const r = await apiPost("/api/remix-script", {
        seed: remixSeed,
        framework: remixFramework,
        customPrompt: remixFramework === "custom" ? remixCustomPrompt : undefined,
      });
      const out = {
        framework: remixFramework,
        text: r.text || "",
        wordCount: r.wordCount || null,
      };
      setRemixOutputs(prev => ({ ...prev, [remixFramework]: out }));
      setRemixedScript(out);
    } catch (e) {
      setRemixError(e.message);
    } finally {
      setRemixing(false);
    }
  };

  // --- Create New Script tab state ---
  const [createTopic, setCreateTopic] = useState("");
  const [createFramework, setCreateFramework] = useState("");
  const [createShowFrameworkDrop, setCreateShowFrameworkDrop] = useState(false);
  const [createCustomPrompt, setCreateCustomPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createdScript, setCreatedScript] = useState(null); // { framework, text, wordCount, topic }
  // Per-framework cache, mirroring the Remix tab. Each entry carries the
  // topic it was generated for, so flipping frameworks after editing the
  // topic won't resurrect a stale script.
  const [createOutputs, setCreateOutputs] = useState({});
  const [createEditing, setCreateEditing] = useState(false);
  const [createEditDraft, setCreateEditDraft] = useState("");
  const [createJustSaved, setCreateJustSaved] = useState(false);

  useEffect(() => { saveToStorage(STORAGE_KEYS.savedScripts, savedScripts); }, [savedScripts]);

  // Generate a brand-new script in the chosen framework for the given
  // topic. Mirrors the Remix flow but hits /api/generate-script with
  // framework-mode params.
  const runCreate = async () => {
    if (!createTopic.trim() || !createFramework) return;
    if (createFramework === "custom" && !createCustomPrompt.trim()) {
      setCreateError("Add custom framework instructions before generating.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    setCreateEditing(false);
    setCreateEditDraft("");
    setCreateJustSaved(false);
    try {
      const r = await apiPost("/api/generate-script", {
        topic: createTopic.trim(),
        framework: createFramework,
        customPrompt: createFramework === "custom" ? createCustomPrompt : undefined,
      });
      const out = {
        framework: createFramework,
        text: r.text || "",
        wordCount: r.wordCount || null,
        topic: createTopic.trim(),
      };
      setCreateOutputs(prev => ({ ...prev, [createFramework]: out }));
      setCreatedScript(out);
    } catch (err) {
      setCreateError(err.message || "Failed to generate script");
    } finally {
      setCreating(false);
    }
  };

  // When the user switches frameworks OR edits the topic, show the
  // cached output for the current framework ONLY if it was generated for
  // the current topic. Otherwise clear the display — but leave the cache
  // intact so switching back restores the script.
  useEffect(() => {
    setCreateEditing(false);
    setCreateEditDraft("");
    setCreateJustSaved(false);
    if (!createFramework) {
      setCreatedScript(null);
      return;
    }
    const entry = createOutputs[createFramework];
    if (entry && entry.topic === createTopic.trim()) {
      setCreatedScript(entry);
    } else {
      setCreatedScript(null);
    }
    // Intentionally omit createOutputs — runCreate manages display on
    // write so we don't need to react to cache-only updates here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFramework, createTopic]);

  // If the user edits their custom-framework prompt, any cached custom
  // output is invalid — the next Generate click should regenerate.
  const createCustomMountedRef = useRef(false);
  useEffect(() => {
    if (!createCustomMountedRef.current) {
      createCustomMountedRef.current = true;
      return;
    }
    setCreateOutputs(prev => {
      if (!prev.custom) return prev;
      const next = { ...prev };
      delete next.custom;
      return next;
    });
    if (createFramework === "custom") setCreatedScript(null);
  }, [createCustomPrompt]);

  // Shared save handler for the Name Script modal — branches on the
  // source tab (remix vs create) to pick the right script + frame the
  // success flash on the correct button. Returns true if save happened.
  const commitSaveFromModal = () => {
    const title = nameModalDraft.trim();
    if (!title) return false;
    if (nameModalSource === "remix") {
      if (!remixedScript) return false;
      const s = {
        id: Date.now(),
        topic: title,
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
    } else if (nameModalSource === "create") {
      if (!createdScript) return false;
      const s = {
        id: Date.now(),
        topic: title,
        hook: "",
        body: createdScript.text,
        cta: "",
        tone: "Create",
        duration: REMIX_FRAMEWORKS.find(f => f.key === createdScript.framework)?.label,
        createdAt: new Date().toISOString(),
      };
      setSavedScripts(prev => [s, ...prev]);
      setCreateJustSaved(true);
      setTimeout(() => setCreateJustSaved(false), 2000);
    }
    setNameModalOpen(false);
    return true;
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
                        // Commit the draft back to the remixed script AND
                        // the per-framework cache so it persists on switch.
                        setRemixedScript(prev => {
                          const next = prev ? { ...prev, text: remixEditDraft } : prev;
                          if (next && remixFramework) {
                            setRemixOutputs(p => ({ ...p, [remixFramework]: next }));
                          }
                          return next;
                        });
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
                        setNameModalSource("remix");
                        setNameModalDraft(remixSeed?.title || "");
                        setNameModalOpen(true);
                      }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition ${
                          remixJustSaved
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}>
                        {remixJustSaved ? <><Check size={12} /> Saved!</> : <><Bookmark size={12} /> Save script</>}
                      </button>
                      <button onClick={() => {
                        // Start over clears ONLY the current framework's
                        // cached output, so the user can regenerate this
                        // one without losing their scripts for the other
                        // frameworks.
                        setRemixOutputs(prev => {
                          const next = { ...prev };
                          if (remixFramework) delete next[remixFramework];
                          return next;
                        });
                        setRemixedScript(null);
                        setRemixEditing(false);
                        setRemixEditDraft("");
                        setRemixJustSaved(false);
                      }}
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
          {/* Step 1 — topic + framework picker */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-sm font-semibold text-gray-900">Write a new script from a topic</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Topic</label>
                <input type="text" value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && createTopic.trim() && createFramework &&
                        !(createFramework === "custom" && !createCustomPrompt.trim())) runCreate();
                  }}
                  placeholder="e.g. why most workouts don't work"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Framework</label>
                <div className="relative">
                  <button onClick={() => setCreateShowFrameworkDrop(!createShowFrameworkDrop)}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 flex items-center justify-between">
                    <span className={createFramework ? "text-gray-900" : "text-gray-400"}>
                      {createFramework ? REMIX_FRAMEWORKS.find(f => f.key === createFramework)?.label : "Pick a framework"}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {createShowFrameworkDrop && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setCreateShowFrameworkDrop(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                        {REMIX_FRAMEWORKS.map(f => (
                          <button key={f.key}
                            onClick={() => { setCreateFramework(f.key); setCreateShowFrameworkDrop(false); }}
                            className={`w-full text-left px-3 py-2 text-sm ${createFramework === f.key ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {createFramework === "custom" && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Custom framework instructions</label>
                <textarea rows={4} value={createCustomPrompt} onChange={(e) => setCreateCustomPrompt(e.target.value)}
                  placeholder="Describe the structure / tone / rules you want this script written with..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}

            <button onClick={runCreate}
              disabled={creating || !createTopic.trim() || !createFramework || (createFramework === "custom" && !createCustomPrompt.trim())}
              className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {creating ? <><Loader2 size={14} className="animate-spin" /> Generating script…</> : <><Sparkles size={14} /> Generate script</>}
            </button>
            {createError && <ErrorMessage message={createError} onRetry={runCreate} />}
          </div>

          {/* Step 2 — generated script output */}
          {createdScript && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Your script</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {REMIX_FRAMEWORKS.find(f => f.key === createdScript.framework)?.label}
                    {createdScript.wordCount?.remix && (
                      <> · {createdScript.wordCount.remix} words</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {createEditing ? (
                    <>
                      <button onClick={() => {
                        // Commit the edited text to BOTH the displayed
                        // script and the per-framework cache so the edit
                        // survives framework switches.
                        setCreatedScript(prev => {
                          const next = prev ? { ...prev, text: createEditDraft } : prev;
                          if (next && createFramework) {
                            setCreateOutputs(p => ({ ...p, [createFramework]: next }));
                          }
                          return next;
                        });
                        setCreateEditing(false);
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                        <Check size={12} /> Done
                      </button>
                      <button onClick={() => { setCreateEditing(false); setCreateEditDraft(""); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <X size={12} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => copyToClipboard(createdScript.text || "")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Copy size={12} /> Copy
                      </button>
                      <button onClick={() => {
                        setCreateEditDraft(createdScript.text || "");
                        setCreateEditing(true);
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Pencil size={12} /> Edit this script
                      </button>
                      <button onClick={() => {
                        setNameModalSource("create");
                        setNameModalDraft(createTopic || "");
                        setNameModalOpen(true);
                      }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition ${
                          createJustSaved ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}>
                        {createJustSaved ? <><Check size={12} /> Saved!</> : <><Bookmark size={12} /> Save script</>}
                      </button>
                      <button onClick={() => {
                        // Start over clears ONLY the current framework's
                        // cached output — other frameworks keep their
                        // scripts for this topic.
                        setCreateOutputs(prev => {
                          const next = { ...prev };
                          if (createFramework) delete next[createFramework];
                          return next;
                        });
                        setCreatedScript(null);
                        setCreateEditing(false);
                        setCreateEditDraft("");
                        setCreateJustSaved(false);
                      }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RefreshCw size={12} /> Start over
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {createEditing ? (
                  <textarea
                    value={createEditDraft}
                    onChange={(e) => setCreateEditDraft(e.target.value)}
                    className="w-full min-h-[400px] text-sm text-gray-900 leading-relaxed font-sans p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                    placeholder="Edit your script…"
                    autoFocus
                  />
                ) : (
                  <pre className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-sans">{createdScript.text}</pre>
                )}
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
          {savedScripts.map(script => {
            // "Remix" and "Create" both produce plain-text scripts in
            // script.body with empty hook/cta. Legacy scripts used the
            // Hook / Body / CTA structure.
            const isPlainText = script.tone === "Remix" || script.tone === "Create";
            return (
              <div key={script.id}
                onClick={() => setViewingScript(script)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{script.topic || script.hook}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{script.tone} · {script.duration}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const full = isPlainText ? script.body : `${script.hook}\n\n${script.body}\n\n${script.cta}`;
                      copyToClipboard(full);
                    }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <Copy size={14} />
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      setSavedScripts(prev => prev.filter(s => s.id !== script.id));
                    }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isPlainText ? (
                  <div>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">
                      {script.tone === "Remix" ? "Remixed script" : "Script"}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">{script.body}</p>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Name Script modal — prompts the user to title the remix before saving */}
      {nameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setNameModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Name your script</h3>
              <button onClick={() => setNameModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Give this saved script a title so you can find it later.</p>
            <input
              type="text"
              value={nameModalDraft}
              onChange={(e) => setNameModalDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const ok = commitSaveFromModal();
                  if (!ok) return;
                }
                if (e.key === "Escape") setNameModalOpen(false);
              }}
              placeholder="e.g. Hormozi hiring hook — v1"
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setNameModalOpen(false)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!nameModalDraft.trim() ||
                  (nameModalSource === "remix" ? !remixedScript : !createdScript)}
                onClick={commitSaveFromModal}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                <Bookmark size={12} /> Save script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Script modal — full-content view when a saved script card is clicked */}
      {viewingScript && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewingScript(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 leading-snug">{viewingScript.topic || viewingScript.hook}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{viewingScript.tone} · {viewingScript.duration}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => {
                  const viewIsPlainText = viewingScript.tone === "Remix" || viewingScript.tone === "Create";
                  const full = viewIsPlainText
                    ? viewingScript.body
                    : `${viewingScript.hook}\n\n${viewingScript.body}\n\n${viewingScript.cta}`;
                  copyToClipboard(full);
                }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Copy size={12} /> Copy
                </button>
                <button onClick={() => setViewingScript(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {(viewingScript.tone === "Remix" || viewingScript.tone === "Create") ? (
                <pre className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-sans">{viewingScript.body}</pre>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Hook</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingScript.hook}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Body</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingScript.body}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">CTA</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingScript.cta}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
