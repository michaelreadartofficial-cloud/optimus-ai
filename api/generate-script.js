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

  let modeInstruction = "";
  if (mode === "idea") {
    modeInstruction = "The user has a video IDEA. Turn this single idea into a complete, engaging short-form video script.";
  } else if (mode === "outline") {
    modeInstruction = "The user has an OUTLINE or bullet points. Expand this outline into a polished, engaging short-form video script.";
  } else if (mode === "polish") {
    modeInstruction = "The user has a ROUGH DRAFT. Polish and refine this draft into a professional, scroll-stopping short-form video script.";
  }

  const prompt = "You are a world-class short-form video scriptwriter for TikTok, Instagram Reels, and YouTube Shorts.\n\n" + modeInstruction + "\n\nTarget duration: " + (duration || "30-45 seconds") + "\nTone: " + (tone || "Energetic") + "\n\nUser input:\n" + input + '\n\nWrite a complete short-form video script with EXACTLY three parts. Return your response as valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):\n{\"hook\": \"The opening 2-3 seconds hook that stops the scroll\", \"body\": \"The main content of the video\", \"cta\": \"The call to action at the end\"}\n\nRules for the script:\n- The HOOK must be attention-grabbing and create curiosity in the first 2-3 seconds\n- The BODY should be conversational, use short punchy sentences, and include pattern interrupts\n- The CTA should drive engagement (follow, comment, share, save)\n- Write for spoken delivery (not written text)\n- Make it feel authentic, not salesy';

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
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
      const jsonMatch = text.match(/{[\\s\\S]*}/);
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
