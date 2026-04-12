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
    // Search with multiple query variations to get more diverse results
    const searchTerms = [query.trim()];
    const words = query.trim().split(/\s+/);
    if (words.length > 1) {
      searchTerms.push(words[0]);
      searchTerms.push(words.join(""));
    } else {
      searchTerms.push(query.trim() + " creator");
      searchTerms.push(query.trim() + " tips");
    }

    const allUsers = [];
    const seenUsernames = new Set();

    // Run searches in parallel for speed
    const searchPromises = searchTerms.map(term =>
      fetchTikTokSearch(term, rapidApiKey).catch(() => [])
    );
    const results = await Promise.all(searchPromises);

    for (const users of results) {
      for (const user of users) {
        const username = user.unique_id || user.uniqueId || "";
        if (username && !seenUsernames.has(username)) {
          seenUsernames.add(username);
          allUsers.push(user);
        }
      }
    }

    if (allUsers.length === 0) {
      return res.json({ creators: [] });
    }

    // Format results
    const creators = allUsers.slice(0, 24).map((user) => {
      const followerCount = user.follower_count || user.followerCount || 0;
      const rawPic = user.avatar_thumb || user.avatarThumb || user.avatar || "";
      // Proxy the image through our API to avoid CORS issues
      const thumbnail = rawPic
        ? `/api/proxy-image?url=${encodeURIComponent(rawPic)}`
        : "";

      return {
        id: user.uid || user.id || user.unique_id || "",
        name: user.nickname || user.unique_id || "",
        username: user.unique_id || user.uniqueId || "",
        description: user.signature || "",
        thumbnail,
        platform: "TikTok",
        subscribers: formatCount(followerCount),
        subscriberCount: followerCount,
        totalViews: "N/A",
        videoCount: user.video_count || user.videoCount || 0,
        isVerified: user.is_verified || user.verified || false,
      };
    });

    // Sort by follower count descending
    creators.sort((a, b) => b.subscriberCount - a.subscriberCount);

    return res.json({ creators });
  } catch (err) {
    console.error("TikTok search error:", err);
    return res.status(500).json({
      error: err.message || "Failed to search TikTok creators",
    });
  }
}

async function fetchTikTokSearch(query, apiKey) {
  try {
    const searchRes = await fetch(
      `https://tiktok-all-in-one.p.rapidapi.com/search/user?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "tiktok-all-in-one.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const text = await searchRes.text();
    console.log("TikTok API response status:", searchRes.status, "body length:", text.length);

    if (!searchRes.ok) {
      console.error("TikTok API error:", text.substring(0, 300));
      return [];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("TikTok API returned non-JSON:", text.substring(0, 300));
      return [];
    }

    // The API may return data in different formats - handle common ones
    if (Array.isArray(data)) return data;
    if (data.user_list) return data.user_list.map(item => item.user_info || item);
    if (data.users) return data.users;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.data && data.data.user_list) return data.data.user_list.map(item => item.user_info || item);

    return [];
  } catch (e) {
    console.error("TikTok fetch failed:", e.message);
    return [];
  }
}

// Format follower counts like "1.2M", "450K", etc.
function formatCount(num) {
  if (!num || num === 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}
