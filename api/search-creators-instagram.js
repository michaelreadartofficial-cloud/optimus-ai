export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return res.status(500).json({
      error: "RapidAPI key not configured. Add RAPIDAPI_KEY in Vercel environment variables."
    });
  }

  try {
    // Step 1: Search Instagram for users matching the query
    const searchRes = await fetch(
      "https://instagram-scraper-stable-api.p.rapidapi.com/search_ig.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
        body: `search_query=${encodeURIComponent(query + " reels")}`,
      }
    );

    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      throw new Error(searchData.message || "Instagram search API error");
    }

    // Extract user results from the response
    // The API returns users in a "users" array
    const users = searchData.users || [];

    if (users.length === 0) {
      return res.json({ creators: [] });
    }

    // Step 2: Format results to match the same structure as YouTube creators
    const creators = users.slice(0, 12).map((item) => {
      const user = item.user || item;
      const followersText = user.search_social_context || "";
      const followerCount = parseFollowers(followersText);

      return {
        id: user.pk || user.id || "",
        name: user.full_name || user.username || "",
        username: user.username || "",
        description: user.biography || followersText,
        thumbnail: user.profile_pic_url || "",
        platform: "Instagram Reels",
        subscribers: followersText || "N/A",
        subscriberCount: followerCount,
        totalViews: "N/A",
        videoCount: 0,
        isVerified: user.is_verified || false,
      };
    });

    // Sort by follower count descending
    creators.sort((a, b) => b.subscriberCount - a.subscriberCount);

    return res.json({ creators });
  } catch (err) {
    console.error("Instagram search error:", err);
    return res.status(500).json({
      error: err.message || "Failed to search Instagram creators",
    });
  }
}

// Parse follower count strings like "3M followers", "336K followers", "1,234 followers"
function parseFollowers(text) {
  if (!text) return 0;
  const match = text.match(/([\d,.]+)\s*(M|K)?\s*followers/i);
  if (!match) return 0;
  let num = parseFloat(match[1].replace(/,/g, ""));
  if (match[2] && match[2].toUpperCase() === "M") num *= 1000000;
  if (match[2] && match[2].toUpperCase() === "K") num *= 1000;
  return Math.round(num);
}
