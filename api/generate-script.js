import { HEIT_SYSTEM_PROMPT, BENS_SYSTEM_PROMPT, buildCustomSystemPrompt } from "./remix-script.js";

// Prefix attached to the framework prompts when CREATING (vs rewriting).
// The HEIT/Bens prompts were built for rewriting an existing transcript,
// so when there's no source we override the source-dependent rules.
const CREATION_MODE_PREFIX = `CREATION MODE OVERRIDE

You will be given a TOPIC, not a source transcript. Your job is to CREATE an original Reel script from scratch about this topic, using the framework rules below.

Since there is no source transcript:
- Write an original hook that fits the topic and the framework's hook-quality standards. Never output "hook could not be extracted" or similar.
- Ignore any rule that requires preserving, extracting, or mirroring the source transcript's exact language, hook, word count, or regional register.
- If the framework has a "±10 words of the original" rule, ignore it — instead target roughly 140 words total (a ~50-second reel) unless the topic clearly calls for a shorter or longer reel.
- If the framework has a "mirror the original regional register" rule, default to neutral international English.
- If the framework has a "CTA only if the source had one" rule, always include a natural CTA that fits the topic (since we are creating, not mirroring a source).

All other voice standards, banned patterns, structural rules, and the OUTPUT FORMAT below still apply exactly as written. Run all quality checks silently — output only the final script in the framework's required format.

HARD OUTPUT RULE — ABSOLUTE: Do NOT append a "NOTES" section, a "Notes" block, a "Quality check" section, a word count, a delta, a variance figure, a detected register line, a "study used" note, any bullet list of meta-commentary, any "---" separator followed by commentary, or anything else after the final script section. The moment the last required script section ends, STOP. Output must contain the script sections and nothing else — no preamble before, no postamble after. This override supersedes any conflicting instruction in the framework below.

Below is the framework:
---
`;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Framework-based creation path — used by the Create New Script tab.
  // Triggered when the request includes a `framework` field.
  if (req.body && req.body.framework) {
    return handleFrameworkCreate(req, res, apiKey);
  }

  // --- Legacy mode/input path (kept for backward compat) ---
  const { mode, input, duration, tone } = req.body;

  if (!input || !input.trim()) {
    return res.status(400).json({ error: "Please provide an input" });
  }

  // Build the prompt based on mode
  let modeInstruction = "";
  if (mode === "idea") {
    modeInstruction = `The user has a video IDEA. Turn this single idea into a complete, engaging short-form video script.`;
  } else if (mode === "outline") {
    modeInstruction = `The user has an OUTLINE or bullet points. Expand this outline into a polished, engaging short-form video script.`;
  } else if (mode === "polish") {
    modeInstruction = `The user has a ROUGH DRAFT. Polish and refine this draft into a professional, scroll-stopping short-form video script. Keep the original message but make it sharper and more engaging.`;
  }

  const prompt = `You are a world-class short-form video scriptwriter for TikTok, Instagram Reels, and YouTube Shorts. You specialize in creating viral, scroll-stopping content.

${modeInstruction}

Target duration: ${duration || "30-45 seconds"}
Tone: ${tone || "Energetic"}

User input:
${input}

Write a complete short-form video script with EXACTLY three parts. Return your response as valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{"hook": "The opening 2-3 seconds hook that stops the scroll", "body": "The main content of the video", "cta": "The call to action at the end"}

Rules for the script:
- The HOOK must be attention-grabbing and create curiosity in the first 2-3 seconds
- The BODY should be conversational, use short punchy sentences, and include pattern interrupts
- The CTA should drive engagement (follow, comment, share, save)
- Use the ${tone || "Energetic"} tone throughout
- Target the ${duration || "30-45 second"} duration
- Write for spoken delivery (not written text)
- Make it feel authentic, not salesy`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(500).json({ error: "AI service error. Please try again." });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the JSON from Claude's response
    let script;
    try {
      // Try to extract JSON if it's wrapped in code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      script = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    }

    return res.status(200).json(script);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

// --- Framework-based creation handler ---
// Takes a TOPIC and a FRAMEWORK and asks the model to write an original
// reel script from scratch using that framework's rules. Reuses the
// HEIT / Bens / Custom prompts from /api/remix-script.js, wrapped with a
// creation-mode prefix that neutralises the source-transcript rules.
async function handleFrameworkCreate(req, res, apiKey) {
  const { topic, framework, customPrompt } = req.body || {};

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Add a topic before generating." });
  }
  if (!framework) {
    return res.status(400).json({ error: "Pick a framework before generating." });
  }

  let frameworkPrompt;
  if (framework === "heit") {
    frameworkPrompt = HEIT_SYSTEM_PROMPT;
  } else if (framework === "bens") {
    frameworkPrompt = BENS_SYSTEM_PROMPT;
  } else if (framework === "custom") {
    if (!customPrompt || !customPrompt.trim()) {
      return res.status(400).json({ error: "Custom framework requires customPrompt text." });
    }
    // For custom, use the same scaffold remix-script uses — no prefix
    // override needed since the user's custom prompt drives the behavior.
    frameworkPrompt = buildCustomSystemPrompt(customPrompt.trim());
  } else {
    return res.status(400).json({ error: `Unknown framework: ${framework}` });
  }

  const systemPrompt =
    framework === "custom"
      ? frameworkPrompt
      : `${CREATION_MODE_PREFIX}\n${frameworkPrompt}`;

  const userMessage = `TOPIC: ${topic.trim()}\n\nCreate an original reel script about this topic using the framework rules. Output only the final script in the framework's required format — no commentary before or after.`;

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({
        error: `Anthropic error (${r.status})`,
        details: errText.slice(0, 300),
      });
    }
    const data = await r.json();
    const text = data?.content?.[0]?.text || "";
    return res.json({
      text,
      framework,
      model: data?.model || "claude-sonnet-4",
      wordCount: { remix: wordCount(text) },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Create failed" });
  }
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}
