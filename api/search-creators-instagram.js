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
    // Search with multiple query variations to widen the pool of creators.
    // RapidAPI's Instagram search returns a limited set per call, so we run
    // several related queries in parallel and dedupe.
    const q = query.trim();
    const searchTerms = [q];
    const words = q.split(/\s+/);

    if (words.length > 1) {
      searchTerms.push(words[0]);
      searchTerms.push(words.join(""));
      searchTerms.push(words[0] + "coach");
      searchTerms.push(words[0] + "tips");
      searchTerms.push(words[0] + "reels");
    } else {
      // Single-word niche — fan out with common creator-suffix patterns
      searchTerms.push(q + "coach");
      searchTerms.push(q + "tips");
      searchTerms.push(q + "daily");
      searchTerms.push(q + "pro");
      searchTerms.push(q + "guru");
      searchTerms.push(q + "reels");
      searchTerms.push("the" + q);
    }

    const allUsers = [];
    const seenUsernames = new Set();

    // Run searches in parallel for speed
    const searchPromises = searchTerms.map(term =>
      fetchInstagramSearch(term, rapidApiKey).catch(() => [])
    );
    const results = await Promise.all(searchPromises);

    for (const users of results) {
      for (const item of users) {
        const user = item.user || item;
        const username = user.username || "";
        if (username && !seenUsernames.has(username)) {
          seenUsernames.add(username);
          allUsers.push(user);
        }
      }
    }

    if (allUsers.length === 0) {
      return res.json({ creators: [] });
    }

    // Format results — proxy the profile image URL so it actually loads
    const creators = allUsers.slice(0, 60).map((user) => {
      const followersText = user.search_social_context || "";
      const followerCount = parseFollowers(followersText);
      const rawPic = user.profile_pic_url || "";
      // Proxy the image through our API to avoid CORS / CDN blocks
      const thumbnail = rawPic
        ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}`
        : "";

      return {
        id: user.pk || user.id || "",
        name: user.full_name || user.username || "",
        username: user.username || "",
        description: user.biography || followersText,
        thumbnail,
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

async function fetchInstagramSearch(query, apiKey) {
  try {
    const searchRes = await fetch(
      "https://instagram-scraper-stable-api.p.rapidapi.com/search_ig.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
        body: `search_query=${encodeURIComponent(query)}`,
      }
    );

    const text = await searchRes.text();
    console.log("Instagram API response status:", searchRes.status, "body length:", text.length);

    if (!searchRes.ok) {
      console.error("Instagram API error:", text.substring(0, 300));
      return [];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Instagram API returned non-JSON:", text.substring(0, 300));
      return [];
    }

    return data.users || [];
  } catch (e) {
    console.error("Instagram fetch failed:", e.message);
    return [];
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
