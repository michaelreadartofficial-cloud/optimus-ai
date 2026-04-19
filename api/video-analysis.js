// Analyze a video's hook, transcript, or "why it went viral" using Claude.
//
// Input: { video: {...}, kind: "hook" | "transcript" | "whyViral" }
// Output: { text: "...", source: "claude" | "caption" }
//
// Transcript note: we DON'T do real speech-to-text here. The Instagram
// scraper APIs don't return spoken-word transcripts. Instead, we return
// the creator's caption verbatim with a clear note — the caption is what
// they chose to describe the video, often summarising the key points.
// For real audio transcription we'd need Whisper / AssemblyAI (separate
// API + cost).

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { video, kind } = req.body || {};
  if (!video || !kind) return res.status(400).json({ error: "Provide { video, kind }" });

  // Transcript handling: try real Whisper transcription first, fall back to
  // the creator's caption if Whisper isn't available.
  if (kind === "transcript") {
    const videoUrl = video.videoUrl;
    const caption = (video.caption || video.title || "").trim();

    // Step 1: attempt real transcription via Whisper
    if (videoUrl && process.env.OPENAI_API_KEY) {
      try {
        // Call our own transcribe endpoint internally. We can't do relative
        // fetch on the server, so we either inline the logic or construct
        // an absolute URL. Easiest: inline the transcription here.
        const transcript = await transcribeWithWhisper(videoUrl, video.shortcode || video.id);
        if (transcript) {
          return res.json({
            text: transcript,
            source: "whisper",
          });
        }
      } catch (e) {
        // Fall through to caption fallback below — don't hard fail on
        // transcription issues
        console.error("Whisper transcription failed:", e.message);
      }
    }

    // Step 2: fall back to the caption
    if (!caption) {
      return res.json({
        text: "This reel has no caption and automatic transcription isn't available. To enable spoken-word transcripts, add OPENAI_API_KEY to your Vercel environment.",
        source: "empty",
      });
    }
    const fallbackNote = process.env.OPENAI_API_KEY
      ? "\n\n─────\n\nNote: automatic transcription failed (the video URL may have expired, or the file was too large). Showing the creator's caption instead."
      : "\n\n─────\n\nNote: This is the creator's CAPTION, not a spoken-word transcript. To enable real audio transcription, add OPENAI_API_KEY to your Vercel environment (uses OpenAI Whisper, ~$0.006 per minute).";
    return res.json({
      text: caption + fallbackNote,
      source: "caption",
    });
  }

  // Hook + whyViral → Claude analysis
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const prompt = buildPrompt(video, kind);
  if (!prompt) return res.status(400).json({ error: `Unknown kind: ${kind}` });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(500).json({ error: "AI service error", details: errText.slice(0, 200) });
    }
    const data = await r.json();
    const text = data?.content?.[0]?.text || "No analysis returned.";
    return res.json({ text, source: "claude" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Analysis failed" });
  }
}

async function transcribeWithWhisper(videoUrl, shortcode) {
  // 1. Fetch the video bytes
  const videoRes = await fetch(videoUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
      Referer: "https://www.instagram.com/",
    },
  });
  if (!videoRes.ok) throw new Error(`video fetch ${videoRes.status}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const sizeMB = videoBuffer.length / (1024 * 1024);
  if (sizeMB > 24) throw new Error(`file too large: ${sizeMB.toFixed(1)}MB`);

  // 2. POST to Whisper
  const form = new FormData();
  const blob = new Blob([videoBuffer], { type: "video/mp4" });
  form.append("file", blob, `${shortcode || "reel"}.mp4`);
  form.append("model", "whisper-1");
  form.append("response_format", "json");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!whisperRes.ok) {
    const err = await whisperRes.text();
    throw new Error(`whisper ${whisperRes.status}: ${err.slice(0, 200)}`);
  }
  const result = await whisperRes.json();
  return result.text || "";
}

function buildPrompt(video, kind) {
  // Gather everything real we know about this video
  const caption = (video.caption || video.title || "").slice(0, 1500);
  const handle = video.channel?.username || video.channel?.name || "the creator";
  const views = video.views ? video.views.toLocaleString() : "unknown";
  const likes = video.likes ?? "unknown";
  const comments = video.comments ?? "unknown";
  const outlier = video.outlierScore ? `${video.outlierScore.toFixed(1)}x their average` : "";
  const engagement = video.engagementRate
    ? `${(video.engagementRate * 100).toFixed(2)}%`
    : "unknown";
  const platform = video.platform || "Instagram Reels";

  const stats = `
Platform: ${platform}
Creator: @${handle}
Views: ${views}${outlier ? ` (outlier: ${outlier})` : ""}
Likes: ${likes}
Comments: ${comments}
Engagement: ${engagement}`.trim();

  const captionBlock = caption ? `Creator's caption:\n"""\n${caption}\n"""` : "No caption available.";

  if (kind === "hook") {
    return `You're analysing a short-form video to help a creator understand why its opening hook works.

${stats}

${captionBlock}

Based on the caption (which usually reflects the video's opening hook) and the engagement stats, write a concise breakdown (3–5 short bullets) of:
1. The hook pattern being used (e.g. pattern interrupt, contrarian take, question loop, stat shock, identity callout)
2. The specific emotional tension or curiosity gap it creates
3. Who this hook is designed to grab (the target viewer's mindset)
4. One concrete tip for replicating this hook structure

Be specific and actionable. No preamble, no "here's the analysis". Just the bullets.`;
  }

  if (kind === "whyViral") {
    return `You're analysing a short-form video that performed well to help a creator understand why.

${stats}

${captionBlock}

Give a concise breakdown (4–6 short bullets) of why this specific video likely outperformed the creator's average:
1. The format / framework (e.g. problem-agitation-solution, myth-debunk, curiosity loop, transformation story)
2. The underlying emotional driver (frustration, aspiration, FOMO, vindication, etc.)
3. What makes it shareable/saveable — is it practical, identity-affirming, contrarian?
4. The specific engagement signals (high comments vs likes = debate; high saves = useful)
5. One replicable tactic another creator could borrow

Be specific and actionable. No preamble. Just the bullets.`;
  }

  return null;
}
