export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Please provide a topic" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const prompt = `You are a world-class short-form content strategist specializing in viral TikTok, Instagram Reels, and YouTube Shorts hooks.

Generate 6 unique, scroll-stopping opening hooks for short-form videos about: "${topic}"

Each hook should be 1-2 sentences and use a different strategy:
1. A curiosity-gap question
2. A bold/controversial statement
3. A personal story opener
4. A surprising statistic or fact
5. A "stop scrolling" pattern interrupt
6. A fear-of-missing-out (FOMO) hook

Return your response as a JSON array of 6 strings. No markdown, no code blocks, just raw JSON like:
["hook 1", "hook 2", "hook 3", "hook 4", "hook 5", "hook 6"]

Rules:
- Each hook should be immediately attention-grabbing
- Write for spoken delivery (TikTok/Reels style)
- Make them feel authentic and conversational, not clickbaity
- Each should make viewers desperate to keep watching
- Keep each hook under 25 words`;

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
        max_tokens: 512,
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

    // Parse the JSON array from Claude's response
    let hooks;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      hooks = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    }

    return res.status(200).json({ hooks });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
