export default async function handler(req, res) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return res.json({ error: "No RAPIDAPI_KEY set", keyPresent: false });
  }

  try {
    const searchRes = await fetch(
      "https://instagram-scraper-stable-api.p.rapidapi.com/search_ig.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
        body: `search_query=fitness`,
      }
    );

    const text = await searchRes.text();

    return res.json({
      keyPresent: true,
      keyPrefix: rapidApiKey.substring(0, 8) + "...",
      apiStatus: searchRes.status,
      apiStatusText: searchRes.statusText,
      responseLength: text.length,
      responsePreview: text.substring(0, 500),
      responseHeaders: Object.fromEntries(searchRes.headers.entries()),
    });
  } catch (e) {
    return res.json({ error: e.message, keyPresent: true });
  }
}
