import { useEffect, useRef, useState } from "react";
import {
  X, Camera, Play, Pause, RotateCcw, Share2,
  Minus, Plus, ChevronDown, ChevronUp, SwitchCamera,
} from "lucide-react";

// Film Now page — the mobile-only fullscreen camera + teleprompter view.
//
// Recording strategy:
//   iOS Safari records the raw camera sensor stream, which for the iPhone
//   front cam in portrait mode comes out in landscape orientation. The
//   live <video> element applies the rotation metadata for preview, but
//   MediaRecorder captures the raw (rotated) frames — so a naive
//   `new MediaRecorder(stream)` recording ends up landscape with the
//   subject sideways.
//
//   To force portrait output, we draw the live video frame into a 720x1280
//   canvas every RAF tick, letterboxing / cropping as needed, then record
//   the canvas's captureStream() combined with the original audio track.
//   The resulting file is guaranteed portrait 9:16 regardless of sensor
//   orientation.
//
// Auto-scroll strategy:
//   We use setInterval (not requestAnimationFrame). iOS Safari pauses RAF
//   callbacks in some situations when a <video> element is actively
//   capturing, which was preventing the teleprompter from starting until
//   the user nudged a slider. setInterval is immune to that pause.

// Final recorded resolution. 1080×1920 = full HD portrait, matching
// Instagram Reels' native upload spec and giving enough pixels that
// the crop-to-canvas step doesn't visibly degrade detail.
const CANVAS_W = 1080;
const CANVAS_H = 1920;

export function FilmPage({ script, onExit }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const drawIntervalRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const teleprompterRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  // Track the latest scrollSpeed without re-creating the scroll interval
  // on every slider tick — we just read the ref inside the tick callback.
  const scrollSpeedRef = useRef(40);

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
  // the same way they see themselves (selfie-mirrored preview).
  const mirrorPreview = facingMode === "user";
  const scriptText = (script?.body || "").trim();

  // Keep the live scrollSpeed value accessible inside the interval tick.
  useEffect(() => { scrollSpeedRef.current = scrollSpeed; }, [scrollSpeed]);

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
          video: {
            facingMode,
            // Request the native landscape sensor capture (iPhone front
            // cam is 4:3 landscape-native). Asking for 9:16 directly
            // invokes a tighter sensor crop on iOS that feels like a
            // digital zoom; asking for the raw 4:3 / 16:9 landscape and
            // letting our canvas crop to 9:16 gives a wider field of
            // view that matches the iPhone's native camera framing.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  // --- Teleprompter auto-scroll via setInterval ---
  //
  // Runs whenever `scrolling` flips true. The tick reads the LIVE scroll
  // speed from a ref so we don't have to reinitialise the interval when
  // the user drags the slider mid-scroll.
  useEffect(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (!scrolling) return;
    const TICK_MS = 33; // ~30fps scroll update, smooth enough, ~3x cheaper than RAF
    scrollIntervalRef.current = setInterval(() => {
      const el = teleprompterRef.current;
      if (!el) return;
      const speed = scrollSpeedRef.current || 0;
      el.scrollTop += (speed * TICK_MS) / 1000;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setScrolling(false);
      }
    }, TICK_MS);
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [scrolling]);

  // --- Recording duration timer ---
  useEffect(() => {
    if (!isRecording) return;
    const start = Date.now();
    const id = setInterval(() => setRecordSeconds(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [isRecording]);

  // Pick the best mime type the browser supports.
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

  // Draw the live video frame into the hidden portrait canvas.
  //
  // Strategy: trust Safari to deliver the video's DISPLAY-oriented
  // dimensions via video.videoWidth/Height (modern Safari + Chrome both
  // do this — they return the post-rotation-metadata dimensions). We
  // then center-crop that displayed frame to fit the 9:16 portrait
  // canvas. No manual rotation — the browser handles it, which avoids
  // double-rotating on platforms where drawImage already applies the
  // rotation internally.
  const drawFrameToCanvas = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Center-crop to 9:16 portrait. When sourceAspect > targetAspect
    // (source is wider than target), crop sides; otherwise crop top/bottom.
    const targetAspect = CANVAS_W / CANVAS_H;
    const sourceAspect = vw / vh;
    let sx, sy, sw, sh;
    if (sourceAspect > targetAspect) {
      sh = vh; sw = Math.round(vh * targetAspect);
      sx = Math.round((vw - sw) / 2); sy = 0;
    } else {
      sw = vw; sh = Math.round(vw / targetAspect);
      sx = 0; sy = Math.round((vh - sh) / 2);
    }
    if (mirrorPreview) {
      ctx.translate(CANVAS_W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  };

  // Wait until the video element has received its first frame and has
  // reliable videoWidth/videoHeight. This matters on iOS — starting
  // MediaRecorder on an empty canvas produces a broken recording.
  const waitForVideoReady = () => new Promise((resolve) => {
    const video = videoRef.current;
    if (!video) { resolve(); return; }
    if (video.readyState >= 2 && video.videoWidth > 0) { resolve(); return; }
    const done = () => {
      video.removeEventListener("loadeddata", done);
      video.removeEventListener("canplay", done);
      resolve();
    };
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
    setTimeout(done, 1500); // fallback — don't block forever
  });

  const startRecording = async () => {
    if (!streamRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      alert("Recording isn't supported on this device. Update iOS / your browser and try again.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Make sure we have real video dimensions before anything below runs.
    await waitForVideoReady();

    // Ensure the canvas has its intrinsic dimensions so captureStream is correct.
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // Start the draw loop at ~30fps. iOS needs at least one draw before
    // captureStream() produces a valid track.
    drawFrameToCanvas();
    drawIntervalRef.current = setInterval(drawFrameToCanvas, 1000 / 30);

    // Combine the canvas's video track with the original mic audio track.
    const canvasStream = canvas.captureStream(30);
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach((t) => canvasStream.addTrack(t));

    chunksRef.current = [];
    const mimeType = pickMimeType();
    let rec;
    try {
      rec = mimeType ? new MediaRecorder(canvasStream, { mimeType }) : new MediaRecorder(canvasStream);
    } catch (err) {
      console.warn("MediaRecorder construction failed:", err);
      alert("Couldn't start recording. Your browser may not support this feature.");
      if (drawIntervalRef.current) { clearInterval(drawIntervalRef.current); drawIntervalRef.current = null; }
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
      // Stop the draw loop now that we're done.
      if (drawIntervalRef.current) { clearInterval(drawIntervalRef.current); drawIntervalRef.current = null; }
    };
    recorderRef.current = rec;
    rec.start();
    setIsRecording(true);
    setRecordSeconds(0);
    // Kick the teleprompter back to the top and start auto-scrolling.
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;
    // Collapse the controls tray so the script + red button are both
    // comfortably visible during the take.
    setControlsOpen(false);
    // Toggle scrolling off-then-on so the scroll effect always re-fires
    // even if the user was already in a "Test scroll" state.
    setScrolling(false);
    setTimeout(() => setScrolling(true), 0);
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
      if (err && err.name === "AbortError") return;
      console.warn("Share failed, falling back to download:", err);
    }
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

  // --- Error states ---

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
      // fixed inset-0 + bg-black ensures the area BEHIND Safari's URL
      // bar is also solid black (no white flash). The inner flex layout
      // uses 100dvh as a max-height so content actually lays out within
      // the visible viewport even as Safari chrome shows/hides.
      <div className="fixed inset-0 bg-black">
        <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
          <div className="flex items-center justify-between px-4 py-3 pt-safe text-white">
            <button onClick={discardRecording} className="flex items-center gap-1.5 text-sm">
              <X size={20} /> Discard
            </button>
            <div className="text-sm font-medium">Preview · {mmss(recordSeconds)}</div>
            <button onClick={onExit} className="text-sm">Done</button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
            <video src={recordedUrl} controls playsInline className="max-h-full max-w-full" />
          </div>
          {/* Buttons padded heavily so they clear Safari's bottom URL bar
              (when PWA isn't installed to home screen) AND the iOS home
              indicator. calc(safe-area + 4rem) = ~34px + 64px = ~100px
              on iPhones, which is enough to sit above Safari chrome. */}
          <div
            className="px-4 pt-4 bg-black flex gap-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)" }}>
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
      </div>
    );
  }

  // --- Live camera + teleprompter ---
  return (
    // fixed inset-0 + bg-black means the area behind Safari's URL bar is
    // also solid black (no white flash). The record button's padding
    // accounts for both the iOS home indicator AND Safari chrome.
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

      {/* Hidden recording canvas — never displayed, but its stream is what
          MediaRecorder captures. Size is fixed portrait 720x1280 so the
          output file is guaranteed 9:16 regardless of sensor orientation. */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="hidden"
      />

      {/* Top bar — close, recording indicator, camera flip. */}
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

      {/* Teleprompter overlay — upper/middle of screen so eyeline stays
          near the lens. */}
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

      {/* Teleprompter controls tray. Positioned above the record button
          with enough clearance for the button's larger bottom padding. */}
      <div className="absolute left-0 right-0 bottom-56 z-20 px-3">
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

      {/* Record button — big red circle, bottom centre. Padding combines
          home indicator safe-area + 4rem extra so Safari's URL bar
          (when the PWA isn't installed to home screen) doesn't obscure
          the button. */}
      <div
        className="absolute left-0 right-0 bottom-0 z-20 flex justify-center"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)" }}>
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
