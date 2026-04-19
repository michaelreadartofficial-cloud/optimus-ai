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

  // Transcript handling: return caption directly, no LLM call needed
  if (kind === "transcript") {
    const caption = (video.caption || video.title || "").trim();
    if (!caption) {
      return res.json({
        text: "This reel has no caption saved. Instagram's public API doesn't expose spoken-word transcripts, so without a caption we can't show the text content.",
        source: "empty",
      });
    }
    return res.json({
      text: `${caption}\n\n─────\n\nNote: This is the creator's CAPTION, not a spoken-word transcript. Instagram's public data doesn't include audio transcripts — to see exactly what the creator says on screen, you'd need to add a transcription service (e.g. OpenAI Whisper, ~$0.006/minute).`,
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
