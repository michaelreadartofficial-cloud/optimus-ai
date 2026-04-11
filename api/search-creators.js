export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, platform, minSubs, maxSubs } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeKey) {
    return res.status(500).json({ error: "YouTube API key not configured." });
  }

  try {
    const seenChannelIds = new Set();
    const allChannelIds = [];

    // Strategy: Use MANY diverse search queries to maximize unique creators found
    // Each query variation pulls different creators from YouTube's index
    const searchQueries = [
      query + " shorts",
      query + " tips shorts",
      query + " tutorial shorts",
      query + " motivation shorts",
      query + " beginner",
      query + " advice",
      query + " how to",
      query + " day in the life",
      query,
    ];

    // Search across multiple query variations to find diverse creators
    for (const q of searchQueries) {
      if (allChannelIds.length >= 80) break;

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=${encodeURIComponent(q)}&maxResults=50&order=relevance&key=${youtubeKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.error) {
        // If quota exceeded on later queries, use what we have
        if (allChannelIds.length > 0) break;
        throw new Error(searchData.error.message || "YouTube API error");
      }

      if (searchData.items) {
        for (const item of searchData.items) {
          const chId = item.snippet.channelId;
          if (chId && !seenChannelIds.has(chId)) {
            seenChannelIds.add(chId);
            allChannelIds.push(chId);
          }
        }
      }
    }

    if (allChannelIds.length === 0) {
      return res.json({ creators: [] });
    }

    // Get detailed channel stats — YouTube allows up to 50 IDs per request
    // So we batch them if we have more than 50
    let allChannelData = [];
    for (let i = 0; i < allChannelIds.length; i += 50) {
      const batch = allChannelIds.slice(i, i + 50).join(",");
      const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${batch}&key=${youtubeKey}`;
      const channelsRes = await fetch(channelsUrl);
      const channelsData = await channelsRes.json();

      if (channelsData.error) {
        if (allChannelData.length > 0) break;
        throw new Error(channelsData.error.message || "YouTube API error");
      }

      if (channelsData.items) {
        allChannelData.push(...channelsData.items);
      }
    }

    // Format the results
    let creators = allChannelData.map(ch => {
      const stats = ch.statistics;
      const snippet = ch.snippet;
      const subCount = parseInt(stats.subscriberCount) || 0;
      return {
        id: ch.id,
        name: snippet.title,
        username: snippet.customUrl || snippet.title,
        description: snippet.description ? snippet.description.substring(0, 200) : "",
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        platform: "YouTube Shorts",
        subscribers: formatNumber(subCount),
        subscriberCount: subCount,
        totalViews: formatNumber(parseInt(stats.viewCount) || 0),
        videoCount: parseInt(stats.videoCount) || 0,
        uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads || null,
      };
    });

    // Apply subscriber filters if provided
    if (minSubs) {
      creators = creators.filter(c => c.subscriberCount >= parseInt(minSubs));
    }
    if (maxSubs) {
      creators = creators.filter(c => c.subscriberCount <= parseInt(maxSubs));
    }

    // Sort by subscriber count descending
    creators.sort((a, b) => b.subscriberCount - a.subscriberCount);

    return res.json({ creators });
  } catch (err) {
    console.error("Search creators error:", err);
    return res.status(500).json({ error: err.message || "Failed to search creators" });
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
