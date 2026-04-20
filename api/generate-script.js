import { HEIT_SYSTEM_PROMPT, BENS_SYSTEM_PROMPT, buildCustomSystemPrompt } from "./remix-script.js";

// --- Hook-style instructions injected into the creation prompt ---
// Each one defines the exact rhetorical flavour of the hook the model
// should open the reel with.
const HOOK_STYLE_DIRECTIVES = {
  controversial: `HOOK STYLE — CONTROVERSIAL
Stake a position most people are too scared, too polite, or too image-conscious to say out loud. The opening line should make a chunk of the audience bristle or want to argue — and make the other chunk feel finally seen. The speaker is willing to be disliked to make the point. No hedging, no disclaimers, no "this is just my opinion".

The bar: someone mid-scroll should either nod in fierce agreement or get instantly defensive. Anything that produces neither feeling is too soft.

Calibration examples (these are the energy — do not copy the wording):
- "If you're over 35 and not on steroids, you're leaving 10 years of your life on the table."
- "Most therapy is just expensive validation. You don't need someone to agree with you — you need someone to tell you you're wrong."
- "Parents who say they'd die for their kids are lying. They won't even miss a workout for them."

Avoid formulaic intros: "the truth is", "the uncomfortable truth", "hot take", "unpopular opinion". Say the controversial thing directly as if it is simply true.`,

  contrarian: `HOOK STYLE — CONTRARIAN TAKE
Flip a piece of widely accepted advice, conventional wisdom, or mainstream belief on its head. The claim is: what "everyone" does is wrong, backwards, or actively making the problem worse. It should feel like insider knowledge that the mainstream has missed.

The contrarian position must be specific enough to be disagreeable. Vague contrarianism ("everything you know about X is wrong") is banned — it's what lazy writers fall back on. Name the specific belief you are flipping.

Calibration examples (these are the energy — do not copy the wording):
- "Cardio doesn't burn fat. It burns muscle, and your body eats muscle first because it's more expensive to keep."
- "Saving money is what keeps most people poor. The people who get rich learn to spend on the right things earlier than everyone else."
- "You don't have a motivation problem. You have a curiosity problem — nobody has to be motivated to do what they actually find interesting."

Avoid literal phrases "everyone thinks", "most people believe", "you've been told" — invent fresher phrasing. The contrarian stance should come through in the claim itself, not a templated intro.`,

  reactive: `HOOK STYLE — REACTIVE CALL OUT
The opening hook is the creator reacting — staring down the camera and saying the thing most people won't. Blunt, unfiltered, taboo-adjacent. The energy is: I am willing to lose followers over this. It should feel like the creator has been holding their tongue and finally isn't.

This style can take many shapes. Valid flavours:
- a direct call-out of a viewer behaviour
- a blunt opinion most would privately agree with but not say out loud
- a recommendation that would get you cancelled in polite company
- a challenge to the viewer's excuse or rationalisation
- contempt or disbelief aimed at a common piece of advice
- naming the hypocrisy in how the topic is usually talked about
- an accusation aimed at a group, industry, or the audience itself

Pick the flavour that fits the topic best. The common thread: the creator is sharing a reactive, unvarnished stance. Not presenting information. Not educating. Reacting.

Calibration examples (these show the bar — do not copy the wording):
- "I'm going to tell you what nobody else has the balls to say — if you're a man over 35 you should probably be on steroids."
- "Your girlfriend isn't ignoring you because she's busy. She's ignoring you because you got comfortable the second she said yes."
- "Stop calling it a toxic workplace. You're not being abused, you're being asked to do the job you applied for."

Notice what those have in common: they name the uncomfortable thing the viewer was hoping wouldn't be named. They use the charged word, not the soft one (see HOOK QUALITY BAR above).

HARD RULES for this style:
- BANNED OPENINGS: Do NOT open with "I don't know who needs to hear this, but..." or any close variant ("Someone needs to hear this...", "Nobody's going to say this, but...", "This is going to upset some people, but...", "I'll say what no one else will..."). These are worn out — they must NEVER appear in this output. Write a fresh opener that carries the same blunt, opinionated, call-out energy without the template.
- The hook must feel reactive and opinionated, not informational or neutral.
- It must land like a real creator saying the thing, not a content marketer introducing a topic.
- No hedging, no softening, no "in my opinion".
- Keep it to one or two sentences.
- Vary the structure every time — second-person call-out, blunt opinion, accusation, contempt for mainstream advice — rotate across generations so outputs don't feel templated.`,
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
  return `CREATION MODE OVERRIDE — ROLE & PLATFORM

You are not a generic scriptwriter. You are an elite Instagram Reels specialist who has studied what stops the scroll on that specific platform. You know:
- The first 4 seconds are the entire battle. If the hook doesn't snap a thumb mid-scroll, nothing else you wrote matters.
- Reels viewers are hostile, distracted, and ruthless — they will not "give the video a chance". The hook earns the next second, and the next, and the next.
- What works on Reels is not what works on LinkedIn, YouTube long-form, or podcast clips. You are writing for phone-first, sound-on-likely-off, endless-feed viewers.
- Charged, taboo-adjacent, or polarising word choices often outperform their sanitised equivalents because they trigger an emotional reaction before the rational brain engages.

ABSOLUTE ANTI-LLM STYLE BAN (read this first and reread it before every line you write)

There is one writing pattern that marks a script as AI-generated faster than any other, and it must NEVER appear in your output. The pattern is:

[mild phrase] — [dramatic metaphor that reframes the mild phrase]

Banned examples (all of these reads as AI slop):
- "That's not a gentle decline — that's a hormonal cliff."
- "This isn't a setback — it's a reset."
- "That's not aging — that's surrender."
- "It's not a habit — it's a prison."
- "That's not discipline — that's fear wearing a suit."

The same pattern with a full stop instead of an em-dash ("That's not X. That's Y.") is equally banned. The same pattern where the second half is a standalone metaphorical noun phrase ("a hormonal cliff", "a slow unraveling", "a quiet betrayal") is banned. Fake-reveal structures ("What looks like X is actually Y") are banned.

These structures feel "punchy" to an LLM but they read as manufactured cleverness to a human viewer and break the spell immediately. If you catch yourself reaching for one, rewrite the sentence plainly with concrete specifics — do not just swap the metaphor or shift the punctuation.

Before you output the final script, do one explicit scan for this pattern across every line. If you find even one instance, rewrite that sentence from a different angle entirely, then re-scan. Only output when the scan finds zero instances.

You will be given a TOPIC, not a source transcript. Your job is to CREATE an original Reel script from scratch about this topic, using the framework rules below.

Since there is no source transcript:
- Write an original hook that fits the topic and the framework's hook-quality standards. Never output "hook could not be extracted" or similar.
- Ignore any rule that requires preserving, extracting, or mirroring the source transcript's exact language, hook, word count, or regional register.
- If the framework has a "±10 words of the original" rule, ignore it — the length target below overrides it.
- If the framework has a "mirror the original regional register" rule, default to neutral international English.
- If the framework has a "CTA only if the source had one" rule, always include a natural CTA that fits the topic (since we are creating, not mirroring a source).

All other voice standards, banned patterns, structural rules, and the OUTPUT FORMAT below still apply exactly as written. Run all quality checks silently — output only the final script in the framework's required format.

HOOK QUALITY BAR (applies to every hook style — hard rule)

The hook is the entire battle on Reels. Before you write it, apply this test:

1. THE HOOK MUST NOT RESTATE THE TOPIC. A topic like "why testosterone drops in men over 35" is NOT a hook. Restating it as "Testosterone starts dropping around 35" is also NOT a hook — it is just the topic in a different shirt. The hook is the ANGLE, STANCE, or CLAIM you bring to the topic that makes a scroller stop. If the hook could be trivially reworded back into the topic sentence, it has failed. Rewrite.

2. THE HOOK MUST HIT ONE OF THESE LEVERS:
   - Pain point named with surgical specificity
   - Belief reversed, flipped, or directly challenged
   - Taboo / uncomfortable truth stated plainly
   - Status, identity, or lifestyle threatened
   - Intrigue opened that can only be resolved by watching the rest
   - Strong emotional bait: fury, validation, fear, indignation, reluctant recognition
   If the hook hits none of these, it is information — not a hook. Information goes in the body.

3. WORD CHOICE IS STRATEGIC. If a charged or taboo word lands harder than the sanitised version, use the charged word. Examples:
   - "steroids" hits harder than "TRT" for a mass audience because it carries stigma
   - "broke" hits harder than "low income"
   - "addict" hits harder than "dependent"
   - "cheating" hits harder than "being unfaithful"
   - "fat" hits harder than "overweight"
   - "failed" hits harder than "didn't succeed"
   Pick the word that triggers the strongest honest reaction — not the one that reads cleanest. Do not sanitise for the sake of politeness. Sanitised language does not stop scrolls.

4. BANNED HOOK OPENINGS — these all mark the script as "content marketing" and get scrolled past:
   - "In this video I'll show you..."
   - "Today we're going to talk about..."
   - "Let me tell you about..."
   - "Here's something about..."
   - "So, [topic]..."
   - Any phrase that sounds like an intro
   - Any phrase that could appear in a LinkedIn post
   - Opening with the topic as a statement of fact ("Testosterone drops as men age.")

5. THE FOUR-SECOND TEST. Imagine a stranger mid-scroll on their phone, thumb moving. Would this specific opening line make them pause? If the answer is "maybe" or "probably not", rewrite. If your hook would feel at home as the opening of a Harvard Business Review article or a blog post, it has failed.

6. HOOK LENGTH. Reels hooks start losing viewers past ~15 words. Shorter is usually better. One sharp sentence beats two polished ones.

HOOK WRITING PROCESS
- First, identify the most charged, most debate-sparking, most taboo-adjacent claim you can honestly make about this topic within the chosen hook style.
- Then write the hook around that claim.
- Do NOT soften the hook to make it "appropriate" — if the framework and style allow the stance, say the thing.

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
  const customCreationWrapper = `ROLE & PLATFORM
You are an elite Instagram Reels specialist. The first 4 seconds are the entire battle. Reels viewers are hostile, distracted, and ruthless. Charged or taboo-adjacent word choices often outperform sanitised equivalents. Write for phone-first, feed-scrolling, attention-starved viewers.

HOOK QUALITY BAR (hard rule)
- The hook must NOT restate the topic. Bring an angle, a stance, or a claim.
- The hook must hit one of: specific pain point, reversed belief, taboo truth, status threat, intrigue that resolves only by watching, or strong emotional bait.
- Pick the word that triggers the strongest reaction, not the one that reads cleanest ("steroids" beats "TRT", "broke" beats "low income", "fat" beats "overweight").
- No intro phrasing ("In this video...", "Today we're going to talk about...", "So, [topic]...").
- The four-second test: a stranger mid-scroll must want to pause. If they wouldn't, rewrite.
- Keep it under ~15 words where possible.

${HOOK_STYLE_DIRECTIVES[hookStyle]}

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
