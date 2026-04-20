import { useEffect, useRef, useState } from "react";
import {
  X, Camera, Play, Pause, Square, RotateCcw, Share2,
  Minus, Plus, ChevronDown, ChevronUp, SwitchCamera,
} from "lucide-react";

// Film Now page — the mobile-only fullscreen camera + teleprompter view.
//
// Flow:
//   1. Request camera + mic permission via getUserMedia.
//   2. Show live camera preview; overlay the script as a scrollable
//      teleprompter (semi-transparent so the user can see themselves
//      underneath the text).
//   3. Tap the big record button to start MediaRecorder — teleprompter
//      begins auto-scrolling. Tap again to stop.
//   4. Show the recorded clip in a preview. The user can Save (opens
//      the native share sheet → Save to Photos), Re-record, or Done.
//
// Web-API caveats we handle:
//   - iOS Safari 14.5+ is required for MediaRecorder. Older iOS versions
//     get a friendly "unsupported" message.
//   - We pick the best supported mime type for the platform (MP4/H.264
//     on iOS, WebM on Android/Chrome).
//   - Saving directly to Photos isn't possible from a browser; we use
//     navigator.share with a File to open the native share sheet.

export function FilmPage({ script, onExit }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const teleprompterRef = useRef(null);
  const scrollRafRef = useRef(null);

  const [permission, setPermission] = useState("prompt"); // prompt | granted | denied | unsupported
  const [facingMode, setFacingMode] = useState("user"); // user = front, environment = rear
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);

  // Teleprompter settings
  const [scrollSpeed, setScrollSpeed] = useState(40); // px per second
  const [fontSize, setFontSize] = useState(22);
  const [scrolling, setScrolling] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  // Mirror the text so a user reading from a front-facing camera sees it
  // the same way they see themselves (selfie-mirrored).
  const mirrorPreview = facingMode === "user";

  const scriptText = (script?.body || "").trim();

  // --- Camera lifecycle ---
  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermission("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // muted + playsInline is required for autoplay on iOS Safari.
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(() => {});
        }
        setPermission("granted");
      } catch (err) {
        console.warn("getUserMedia failed:", err);
        setPermission("denied");
      }
    }
    start();
    return () => {
      cancelled = true;
      // Tear down the stream when we unmount OR when facingMode changes
      // (the cleanup runs before the effect re-runs).
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  // --- Teleprompter auto-scroll ---
  useEffect(() => {
    if (!scrolling) {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const el = teleprompterRef.current;
      if (el) {
        el.scrollTop += scrollSpeed * dt;
        // Auto-stop when we've scrolled to the bottom.
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          setScrolling(false);
          return;
        }
      }
      scrollRafRef.current = requestAnimationFrame(tick);
    };
    scrollRafRef.current = requestAnimationFrame(tick);
    return () => scrollRafRef.current && cancelAnimationFrame(scrollRafRef.current);
  }, [scrolling, scrollSpeed]);

  // --- Recording duration timer ---
  useEffect(() => {
    if (!isRecording) return;
    const start = Date.now();
    const id = setInterval(() => setRecordSeconds(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [isRecording]);

  // Pick the best mime type the browser supports. iOS Safari typically
  // only has video/mp4; Chrome/Android prefer video/webm (VP8/VP9/Opus).
  const pickMimeType = () => {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const mt of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mt)) {
        return mt;
      }
    }
    return "";
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      alert("Recording isn't supported on this device. Update iOS / your browser and try again.");
      return;
    }
    chunksRef.current = [];
    const mimeType = pickMimeType();
    let rec;
    try {
      rec = mimeType ? new MediaRecorder(streamRef.current, { mimeType }) : new MediaRecorder(streamRef.current);
    } catch (err) {
      console.warn("MediaRecorder construction failed:", err);
      alert("Couldn't start recording. Your browser may not support this feature.");
      return;
    }
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || "video/mp4";
      const blob = new Blob(chunksRef.current, { type });
      setRecordedBlob(blob);
      setRecordedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    };
    recorderRef.current = rec;
    rec.start();
    setIsRecording(true);
    setRecordSeconds(0);
    // Kick off the teleprompter scroll when recording starts — classic
    // teleprompter behaviour, no extra tap needed.
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;
    setScrolling(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
    setScrolling(false);
  };

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;
  };

  // Open the native share sheet with the recorded file. On iOS this
  // exposes "Save Video" → Photos. On Android it exposes "Save" → Gallery.
  const shareRecording = async () => {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([recordedBlob], `optimus-${Date.now()}.${ext}`, { type: recordedBlob.type });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "Optimus.AI recording" });
        return;
      }
    } catch (err) {
      // Share was dismissed or failed — fall through to download.
      if (err && err.name === "AbortError") return;
      console.warn("Share failed, falling back to download:", err);
    }
    // Fallback: trigger a download so the user can move it to Photos manually.
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const mmss = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // --- Render states ---

  if (permission === "unsupported") {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Camera size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Camera not supported</h2>
        <p className="text-sm text-gray-400 max-w-xs">Your browser can't access the camera. Try Safari on iOS 14.5+ or Chrome on Android.</p>
        <button onClick={onExit} className="mt-6 px-5 py-2 bg-white text-black rounded-lg text-sm font-medium">Close</button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Camera size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Camera permission denied</h2>
        <p className="text-sm text-gray-400 max-w-xs">To film, you'll need to allow camera and microphone access in your browser settings, then try again.</p>
        <button onClick={onExit} className="mt-6 px-5 py-2 bg-white text-black rounded-lg text-sm font-medium">Close</button>
      </div>
    );
  }

  // --- Post-recording preview ---
  if (recordedUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 pt-safe text-white">
          <button onClick={discardRecording} className="flex items-center gap-1.5 text-sm">
            <X size={20} /> Discard
          </button>
          <div className="text-sm font-medium">Preview · {mmss(recordSeconds)}</div>
          <button onClick={onExit} className="text-sm">Done</button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-black">
          <video src={recordedUrl} controls playsInline className="max-h-full max-w-full" />
        </div>
        <div className="pb-safe px-4 pt-4 bg-black flex gap-3">
          <button
            onClick={discardRecording}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 text-white text-sm font-medium">
            <RotateCcw size={16} /> Re-record
          </button>
          <button
            onClick={shareRecording}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black text-sm font-semibold">
            <Share2 size={16} /> Save Video
          </button>
        </div>
      </div>
    );
  }

  // --- Live camera + teleprompter ---
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Camera preview — fills the screen, centre-cropped. */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: mirrorPreview ? "scaleX(-1)" : "none" }}
      />

      {/* Top bar — close button, recording indicator, camera flip. */}
      <div className="absolute top-0 left-0 right-0 pt-safe px-4 py-3 flex items-center justify-between z-20">
        <button
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
          <X size={20} />
        </button>
        {isRecording ? (
          <div className="flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wider">REC {mmss(recordSeconds)}</span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium truncate max-w-[200px]">
            {script?.topic || "Script"}
          </div>
        )}
        <button
          onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
          disabled={isRecording}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-40">
          <SwitchCamera size={20} />
        </button>
      </div>

      {/* Teleprompter overlay — positioned in the upper/middle portion of
          the screen so the speaker's eyeline stays near the lens. */}
      <div className="absolute left-3 right-3 top-20 bottom-56 z-10">
        <div
          ref={teleprompterRef}
          className="w-full h-full rounded-2xl bg-black/55 backdrop-blur-sm text-white overflow-y-auto p-5"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}>
          <div className="whitespace-pre-wrap" style={{ paddingBottom: "40vh" }}>
            {scriptText || "This script has no body text to display."}
          </div>
        </div>
      </div>

      {/* Teleprompter controls — collapsible tray just above the record
          button. */}
      <div className="absolute left-0 right-0 bottom-40 z-20 px-3">
        <div className="bg-black/55 backdrop-blur-sm rounded-2xl text-white">
          <button
            onClick={() => setControlsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium">
            <span>Teleprompter</span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <span>{scrollSpeed} px/s · {fontSize}px</span>
              {controlsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </button>
          {controlsOpen && (
            <div className="px-4 pb-3 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px] text-gray-300">
                  <span>Scroll speed</span>
                  <span>{scrollSpeed} px/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScrollSpeed((s) => Math.max(10, s - 10))}
                    className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <input
                    type="range" min={10} max={120} step={5}
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                    className="flex-1 accent-white"
                  />
                  <button
                    onClick={() => setScrollSpeed((s) => Math.min(120, s + 10))}
                    className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px] text-gray-300">
                  <span>Font size</span>
                  <span>{fontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                    className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <input
                    type="range" min={14} max={36} step={1}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="flex-1 accent-white"
                  />
                  <button
                    onClick={() => setFontSize((s) => Math.min(36, s + 2))}
                    className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              {!isRecording && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setScrolling((s) => !s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-xs font-medium">
                    {scrolling ? <><Pause size={12} /> Pause scroll</> : <><Play size={12} /> Test scroll</>}
                  </button>
                  <button
                    onClick={() => { if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0; }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-xs font-medium">
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record button — the big red circle, bottom centre. */}
      <div className="absolute left-0 right-0 bottom-0 pb-safe z-20 flex justify-center pb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={permission !== "granted"}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40">
          {isRecording ? (
            <span className="w-7 h-7 bg-red-500 rounded-md" />
          ) : (
            <span className="w-16 h-16 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
