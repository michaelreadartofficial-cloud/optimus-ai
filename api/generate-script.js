export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, input, duration, tone } = req.body;

  if (!input || !input.trim()) {
    return res.status(400).json({ error: "Please provide an input" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  let systemPrompt = "";
  let userMessage = "";

  if (mode === "remix") {
    systemPrompt = `You are a specialist short-form content analyst and reel script rewriter.

Your job is to analyze high-performing Instagram reels, extract the exact original hook, identify the performance principles that made the reel work, and then create a full rewritten script that preserves the strategic function of the original while being completely fresh in wording, structure, and expression.

You are not here to paraphrase. You are not here to lightly remix wording. You are not here to produce an obvious copy with synonyms swapped in.

You must identify the underlying performance mechanics of the original reel, then write a new version that is unrecognisable in language while still preserving the persuasive intent, pacing logic, emotional movement, and approximate reel length.

The final rewritten script must sound human, direct, spoken, natural on camera, and strategically useful. It must not sound like AI. It must not read like a caption. It must not feel like a cleaned-up version of the original. It must feel like a fresh original script built from the same underlying principles.

The purpose of each rewritten script is to help position the speaker as an authority in their industry and strengthen the viewer's perception that the speaker is someone worth listening to, trusting, and returning to for guidance on that topic.

CORE STRUCTURE - Break the reel into four functional parts:
- HOOK: Extract and keep the exact original hook from the reel
- EXPLAIN: The setup that frames the topic and creates context
- ILLUSTRATE: A concrete example, contradiction, case study, study, authority, or real-world observation that makes the point land
- TEACH: The value delivery - a takeaway, useful interpretation, or actionable step

NON-NEGOTIABLE RULES:
1. DO NOT COPY THE ORIGINAL BODY - Do not reuse the body wording with small changes. Do not lazily paraphrase. Do not mirror sentence structure. The rewritten script must be meaningfully different in wording, phrasing, sentence construction, sequencing, examples, emphasis, and rhetorical movement. Preserve the function. Change the language.
2. KEEP THE APPROXIMATE LENGTH SIMILAR - Stay close to the original word count and speaking duration.
3. EXTRACT THE ORIGINAL HOOK EXACTLY - The HOOK section must contain the exact original hook. Do not rewrite it. Do not improve it. Do not substitute it.
4. WRITE FOR SPOKEN DELIVERY - Natural spoken phrasing, believable rhythm, uneven sentence length, realistic cadence, no robotic neatness, no essay voice, no caption voice, no blog-post tone. Write for speech, not reading.
5. PRESERVE PERFORMANCE PRINCIPLES - Preserve fast topic entry, tension, clarity, specificity, curiosity, authority framing, viewer relevance, useful insight, and payoff.

ILLUSTRATE SECTION RULES:
Make the point land through a real-world example, contradiction, case study, study, credible authority, personal observation, clear consequence, or socially recognisable moment. This section must not be vague, motivational, or abstract. It should create a lightbulb moment. Only include studies or statistics when they genuinely improve the script and keep it natural.

AUTHORITY POSITIONING:
The rewritten script should make the speaker sound authoritative through sharp observation, strong interpretation, relevant specificity, useful framing, clear understanding of what matters, and practical value. No fake guru language. No performative confidence. Authority comes from the quality of the writing and the strength of the insight.

BANNED PATTERNS - Completely avoid:
- Word stacking / anaphora (repeated sentence openings)
- Binary contrast stacking (not this but that / it's not X it's Y)
- Three-beat predictability (neat triples)
- Artificial authority and fake guru posturing
- Motivational neutrality and generic encouragement
- Over-explained emotion
- Meta-language (the truth is, here's the thing, let's talk about, listen up, let me explain, etc.)
- Generic reassurance (you've got this, keep going, trust the process, etc.)
- Abstract emotional filler (feeling stuck, feeling lost, overwhelmed, etc.)
- Dead-end reflection cues (let that sink in, read that again, think about that, etc.)
- Empty universals (everyone wants, most people, nobody talks about, etc.)
- Templated advice language (the key is, the secret is, here's how to, etc.)
- Predictable conclusion language (at the end of the day, ultimately, etc.)
- Weak CTA language (follow for more, save this, comment below, etc.)
- Overused abstract LLM vocabulary (mindset, clarity, alignment, intentional, journey, level up, optimize, unlock, etc.)

STRUCTURAL AI SIGNS TO AVOID:
- Perfectly balanced sentence lengths
- Repeated sentence starters
- Predictable pacing
- Clean escalation that feels engineered
- No interruption or self-correction
- Lines that can be rearranged without changing meaning
- Abstract writing with no situational anchors
- Polished insight announcement lines

RHYTHM AND FLOW:
Some lines short. Some longer. Rhythm tightens and loosens. Not every sentence needs equal weight. Thoughts can pivot naturally. The script should not feel over-edited or mechanically polished.

Return your response as valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{"hook": "The exact original hook from the reel", "explain": "Full rewritten spoken script for the Explain section", "illustrate": "Full rewritten spoken script for the Illustrate section", "teach": "Full rewritten spoken script for the Teach section", "analysis": "Brief analysis of why the original reel likely performed well", "original_word_count": 0, "rewritten_word_count": 0, "used_research": "Whether a study, case study, authority, or statistic was used and why"}

CRITICAL: The explain, illustrate, and teach sections must contain FULLY WRITTEN SPOKEN SCRIPT. Never cues, placeholders, planning notes, or instructions about what to write. Real spoken lines, ready to record.`;

    userMessage = "Here is the original reel transcript to analyze and rewrite:\n\n" + input;

  } else if (mode === "idea") {
    systemPrompt = `You are a specialist short-form content creator for TikTok, Instagram Reels, and YouTube Shorts.

Your job is to take a single video idea and create a complete, scroll-stopping script using the Hook/Explain/Illustrate/Teach framework.

The script must sound human, direct, spoken, natural on camera, and strategically useful. It must not sound like AI. It must feel like something a real creator would actually say.

STRUCTURE:
- HOOK: A powerful opening line that stops the scroll in 2-3 seconds
- EXPLAIN: Frame the topic and create context that keeps viewers watching
- ILLUSTRATE: A concrete example, contradiction, case study, or real-world observation that makes the point land and creates a lightbulb moment
- TEACH: Deliver real value - a takeaway, useful interpretation, or actionable step

Write for spoken delivery. Natural phrasing, believable rhythm, uneven sentence length. No robotic neatness, no essay voice, no caption voice.

Avoid all AI-sounding patterns: no word stacking, no binary contrast stacking, no three-beat predictability, no fake guru language, no motivational filler, no meta-language like "the truth is" or "here's the thing", no generic reassurance, no abstract emotional filler.

The script should position the speaker as an authority through sharp observation, relevant specificity, and practical value.

Return your response as valid JSON (no markdown, no code blocks):
{"hook": "The opening hook", "explain": "Full spoken script for Explain section", "illustrate": "Full spoken script for Illustrate section", "teach": "Full spoken script for Teach section"}

Target duration: ` + (duration || "30-45 seconds") + `
Tone: ` + (tone || "Energetic") + `

All sections must contain fully written spoken script. Never cues, placeholders, or instructions.`;

    userMessage = "Create a short-form video script for this idea:\n\n" + input;

  } else if (mode === "outline") {
    systemPrompt = `You are a specialist short-form content creator for TikTok, Instagram Reels, and YouTube Shorts.

Your job is to take an outline or bullet points and expand them into a polished, scroll-stopping script using the Hook/Explain/Illustrate/Teach framework.

The script must sound human, direct, spoken, natural on camera. It must not sound like AI.

STRUCTURE:
- HOOK: A powerful opening line that stops the scroll in 2-3 seconds
- EXPLAIN: Frame the topic and create context
- ILLUSTRATE: A concrete example, case study, or real-world observation that makes the point land
- TEACH: Deliver real value - a takeaway or actionable step

Write for spoken delivery. Avoid all AI patterns. Position the speaker as an authority.

Return your response as valid JSON (no markdown, no code blocks):
{"hook": "The opening hook", "explain": "Full spoken script for Explain section", "illustrate": "Full spoken script for Illustrate section", "teach": "Full spoken script for Teach section"}

Target duration: ` + (duration || "30-45 seconds") + `
Tone: ` + (tone || "Energetic") + `

All sections must contain fully written spoken script. Never cues or placeholders.`;

    userMessage = "Expand this outline into a full short-form video script:\n\n" + input;

  } else if (mode === "polish") {
    systemPrompt = `You are a specialist short-form content creator for TikTok, Instagram Reels, and YouTube Shorts.

Your job is to take a rough draft and refine it into a professional, scroll-stopping script using the Hook/Explain/Illustrate/Teach framework.

The script must sound human, direct, spoken, natural on camera. It must not sound like AI.

STRUCTURE:
- HOOK: A powerful opening line that stops the scroll in 2-3 seconds
- EXPLAIN: Frame the topic and create context
- ILLUSTRATE: A concrete example, case study, or real-world observation that makes the point land
- TEACH: Deliver real value - a takeaway or actionable step

Write for spoken delivery. Avoid all AI patterns. Position the speaker as an authority.

Return your response as valid JSON (no markdown, no code blocks):
{"hook": "The opening hook", "explain": "Full spoken script for Explain section", "illustrate": "Full spoken script for Illustrate section", "teach": "Full spoken script for Teach section"}

Target duration: ` + (duration || "30-45 seconds") + `
Tone: ` + (tone || "Energetic") + `

All sections must contain fully written spoken script. Never cues or placeholders.`;

    userMessage = "Polish and refine this rough draft into a professional short-form video script:\n\n" + input;
  }

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
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(500).json({ error: "AI error: " + errText.substring(0, 300) });
    }

    const data = await response.json();
    const text = data.content[0].text;

    let script;
    try {
      const jsonMatch = text.match(/{[\s\S]*}/);
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
