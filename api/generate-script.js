import { HEIT_SYSTEM_PROMPT, BENS_SYSTEM_PROMPT, buildCustomSystemPrompt } from "./remix-script.js";

// --- Hook-style instructions injected into the creation prompt ---
// Each one defines the exact rhetorical flavour of the hook the model
// should open the reel with.
const HOOK_STYLE_DIRECTIVES = {
  controversial: `HOOK STYLE — CONTROVERSIAL
The opening hook must be a spicy, divisive statement that takes a bold position likely to spark debate or pushback. It should feel like the speaker is willing to be disliked to make the point. Avoid hedging. Stake a side. Make a claim that a chunk of the audience will instinctively disagree with — but that the rest of the script will then justify.
Do NOT use formulaic openers like "the truth is" or "the uncomfortable truth". Just state the controversial claim directly.`,

  contrarian: `HOOK STYLE — CONTRARIAN TAKE
The opening hook must flip a piece of conventional wisdom or popular advice on its head. The structure is: name what "everyone" believes or does, then assert that it is wrong, backwards, or counterproductive. It should feel like insider knowledge that disagrees with the mainstream.
Do NOT use the literal phrases "everyone thinks", "most people believe", or "you've been told". Invent fresher phrasing. The contrarian stance comes through the claim itself, not a formulaic intro.`,

  reactive: `HOOK STYLE — REACTIVE CALL OUT
The opening hook must be a direct, almost confrontational, address to the viewer. It calls out a behaviour or belief the viewer is likely engaging in and names the uncomfortable consequence. Use the opener formula:

"I don't know who needs to hear this, but [specific behaviour or belief the viewer has] [uncomfortable consequence or harsh reality they need to accept]."

Example (do NOT reuse — generate a fresh version in the topic's voice):
"I don't know who needs to hear this, but if you're working out every day but still not seeing results then you're going to have to live with the fact that you're probably always going to be fat."

The hook must land as a direct call-out — specific, second-person, and blunt. It should feel like the speaker is naming something the viewer has been avoiding. Keep it to one or two sentences max.`,
};

// --- Video-length instructions → word count targets ---
// Spoken cadence is ~2.7 words/second. Targets are the midpoint of each
// range with a tight tolerance so the reel lands in the user's chosen
// duration bucket.
const VIDEO_LENGTH_DIRECTIVES = {
  "30-60": `TARGET LENGTH — 30 to 60 seconds
Write a script that, at natural spoken pace, runs between 30 and 60 seconds. That translates to roughly 100 to 160 spoken words total (HOOK + BODY + CTA combined). Aim for around 130 words. Do NOT exceed 160. Do NOT go under 100.`,
  "60-90": `TARGET LENGTH — 60 to 90 seconds
Write a script that, at natural spoken pace, runs between 60 and 90 seconds. That translates to roughly 160 to 240 spoken words total (HOOK + BODY + CTA combined). Aim for around 200 words. Do NOT exceed 240. Do NOT go under 160.`,
  "90-120": `TARGET LENGTH — 90 to 120 seconds
Write a script that, at natural spoken pace, runs between 90 and 120 seconds. That translates to roughly 240 to 325 spoken words total (HOOK + BODY + CTA combined). Aim for around 280 words. Do NOT exceed 325. Do NOT go under 240.`,
};

// Prefix attached to the framework prompts when CREATING (vs rewriting).
// The HEIT/Bens prompts were built for rewriting an existing transcript,
// so when there's no source we override the source-dependent rules.
function buildCreationPrefix(hookStyle, videoLength) {
  const hookDirective = HOOK_STYLE_DIRECTIVES[hookStyle] || "";
  const lengthDirective = VIDEO_LENGTH_DIRECTIVES[videoLength] || "";
  return `CREATION MODE OVERRIDE

You will be given a TOPIC, not a source transcript. Your job is to CREATE an original Reel script from scratch about this topic, using the framework rules below.

Since there is no source transcript:
- Write an original hook that fits the topic and the framework's hook-quality standards. Never output "hook could not be extracted" or similar.
- Ignore any rule that requires preserving, extracting, or mirroring the source transcript's exact language, hook, word count, or regional register.
- If the framework has a "±10 words of the original" rule, ignore it — the length target below overrides it.
- If the framework has a "mirror the original regional register" rule, default to neutral international English.
- If the framework has a "CTA only if the source had one" rule, always include a natural CTA that fits the topic (since we are creating, not mirroring a source).

All other voice standards, banned patterns, structural rules, and the OUTPUT FORMAT below still apply exactly as written. Run all quality checks silently — output only the final script in the framework's required format.

${hookDirective}

${lengthDirective}

HARD OUTPUT RULE — ABSOLUTE: Do NOT append a "NOTES" section, a "Notes" block, a "Quality check" section, a word count, a delta, a variance figure, a detected register line, a "study used" note, any bullet list of meta-commentary, any "---" separator followed by commentary, or anything else after the final script section. The moment the last required script section ends, STOP. Output must contain the script sections and nothing else — no preamble before, no postamble after. This override supersedes any conflicting instruction in the framework below.

Below is the framework:
---
`;
}

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
  const { topic, framework, customPrompt, hookStyle, videoLength } = req.body || {};

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Add a topic before generating." });
  }
  if (!framework) {
    return res.status(400).json({ error: "Pick a framework before generating." });
  }
  if (!hookStyle || !HOOK_STYLE_DIRECTIVES[hookStyle]) {
    return res.status(400).json({ error: "Pick a hook style before generating." });
  }
  if (!videoLength || !VIDEO_LENGTH_DIRECTIVES[videoLength]) {
    return res.status(400).json({ error: "Pick a video length before generating." });
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

  // For custom, prepend a lightweight scaffold so the user's prompt also
  // gets the hook-style + length directives without the full creation
  // prefix (which refers to "the framework below").
  const creationPrefix = buildCreationPrefix(hookStyle, videoLength);
  const customCreationWrapper = `${HOOK_STYLE_DIRECTIVES[hookStyle]}

${VIDEO_LENGTH_DIRECTIVES[videoLength]}

HARD OUTPUT RULE — ABSOLUTE: The moment the last required script section ends, STOP. No NOTES section, no meta-commentary, no word counts, no postamble.

---
`;

  const systemPrompt =
    framework === "custom"
      ? `${customCreationWrapper}\n${frameworkPrompt}`
      : `${creationPrefix}\n${frameworkPrompt}`;

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
