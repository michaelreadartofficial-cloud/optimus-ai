// Transcribe an Instagram reel (or any mp4) using OpenAI Whisper.
//
// Flow:
//   1. Fetch the video from its signed CDN URL (same trick as proxy-video)
//   2. POST the binary to Whisper as multipart/form-data
//   3. Return { transcript }
//
// Requires: OPENAI_API_KEY in env (add in Vercel project settings).
//
// Cost: ~$0.006 per minute of audio. A typical 30-second reel = $0.003.
// Whisper has a 25MB file limit. Most Instagram reels are well under that.

export const config = {
  api: {
    bodyParser: { sizeLimit: "30mb" },
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { videoUrl, filename } = req.body || {};
  if (!videoUrl) return res.status(400).json({ error: "Provide videoUrl" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_API_KEY not configured — add it to Vercel env vars to enable real transcripts.",
      code: "NO_API_KEY",
    });
  }

  try {
    // 1. Download the video from Instagram CDN
    const videoRes = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
    });
    if (!videoRes.ok) {
      return res.status(502).json({
        error: `Couldn't fetch video from Instagram (${videoRes.status}). The URL may have expired — try re-saving the video from the feed.`,
        code: "FETCH_FAILED",
      });
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const sizeMB = videoBuffer.length / (1024 * 1024);
    if (sizeMB > 24) {
      return res.status(413).json({
        error: `Video is ${sizeMB.toFixed(1)}MB — Whisper's limit is 25MB. Use a shorter reel.`,
        code: "TOO_LARGE",
      });
    }

    // 2. POST to Whisper
    const form = new FormData();
    const safeFilename = (filename || "reel.mp4").replace(/[^\w\-.]/g, "_");
    const blob = new Blob([videoBuffer], { type: "video/mp4" });
    form.append("file", blob, safeFilename);
    form.append("model", "whisper-1");
    form.append("response_format", "json");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      return res.status(whisperRes.status).json({
        error: `Whisper API error (${whisperRes.status})`,
        details: errText.slice(0, 300),
      });
    }

    const result = await whisperRes.json();
    return res.json({
      transcript: result.text || "",
      source: "whisper",
      sizeMB: Number(sizeMB.toFixed(2)),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Transcription failed" });
  }
}
