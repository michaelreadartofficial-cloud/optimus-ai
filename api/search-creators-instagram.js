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
    // MANY related queries in parallel and dedupe.
    //
    // IMPORTANT: for multi-word queries we keep the FULL phrase as primary
    // and never fan out on a single word alone — that pulls in off-topic
    // accounts (e.g. searching "online fitness coach" and getting
    // "toponlineshop" because "online" matched).
    const q = query.trim();
    const searchTerms = new Set([q]);
    const words = q.split(/\s+/);

    const creatorSuffixes = ["coach", "tips", "daily", "pro", "guru", "reels", "official", "life", "motivation", "hq", "journey"];
    const creatorPrefixes = ["the", "real", "best", "top", "daily", "mr", "ms"];

    if (words.length > 1) {
      const joined = words.join("");             // e.g. "onlinefitnesscoach"
      const lastTwo = words.slice(-2).join("");  // e.g. "fitnesscoach"
      searchTerms.add(joined);
      searchTerms.add(lastTwo);
      // Full-phrase + suffix / prefix variants (keep the topic intact)
      for (const s of creatorSuffixes) searchTerms.add(joined + s);
      for (const p of creatorPrefixes) searchTerms.add(p + joined);
      // Last-two-word variants (the role usually lives at the end: "fitness coach")
      for (const s of creatorSuffixes.slice(0, 6)) searchTerms.add(lastTwo + s);
      for (const p of creatorPrefixes.slice(0, 4)) searchTerms.add(p + lastTwo);
    } else {
      // Single-word niche: fan out with many creator-suffix and prefix patterns
      for (const s of creatorSuffixes) searchTerms.add(q + s);
      for (const p of creatorPrefixes) searchTerms.add(p + q);
      searchTerms.add(q + "s");
      searchTerms.add(q + "er");
      searchTerms.add(q + "girl");
      searchTerms.add(q + "guy");
    }

    const searchTermsArr = Array.from(searchTerms);

    const allUsers = [];
    const seenUsernames = new Set();

    // Run searches in parallel for speed
    const searchPromises = searchTermsArr.map(term =>
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
    const creators = allUsers.slice(0, 150).map((user) => {
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
        // Only include the actual biography. Do NOT fall back to follower
        // text — the frontend matches against this field for relevance and
        // "773K followers" would pollute results.
        description: user.biography || "",
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
