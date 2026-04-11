export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, platform } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;

  // Currently supporting YouTube — TikTok and Instagram coming soon
  if (platform === "TikTok" || platform === "Instagram Reels") {
    return res.status(400).json({
      error: `${platform} search is coming soon. YouTube Shorts is available now.`
    });
  }

  if (!youtubeKey) {
    return res.status(500).json({ error: "YouTube API key not configured. Add YOUTUBE_API_KEY in Vercel environment variables." });
  }

  try {
    // Strategy: Search for SHORT-FORM VIDEOS in this niche, then extract the unique creators
    // This finds creators who actually MAKE content in the niche, not just channels with the word in their name
    const searchQueries = [
      query + " shorts",
      query + " short form",
      query,
    ];

    const seenChannelIds = new Set();
    const allChannelIds = [];

    // Search for videos across multiple query variations to get diverse creators
    for (const q of searchQueries) {
      if (allChannelIds.length >= 30) break;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=${encodeURIComponent(q)}&maxResults=15&order=relevance&key=${youtubeKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.error) {
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

    // Step 2: Get detailed channel stats for all unique creators found
    // YouTube API allows up to 50 IDs per request
    const channelIds = allChannelIds.slice(0, 50).join(",");
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelIds}&key=${youtubeKey}`;
    const channelsRes = await fetch(channelsUrl);
    const channelsData = await channelsRes.json();

    if (channelsData.error) {
      throw new Error(channelsData.error.message || "YouTube API error");
    }

    // Step 3: Format the results
    const creators = (channelsData.items || []).map(ch => {
      const stats = ch.statistics;
      const snippet = ch.snippet;
      return {
        id: ch.id,
        name: snippet.title,
        description: snippet.description ? snippet.description.substring(0, 200) : "",
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        platform: "YouTube Shorts",
        subscribers: formatNumber(parseInt(stats.subscriberCount) || 0),
        subscriberCount: parseInt(stats.subscriberCount) || 0,
        totalViews: formatNumber(parseInt(stats.viewCount) || 0),
        videoCount: parseInt(stats.videoCount) || 0,
        uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads || null,
      };
    });

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
