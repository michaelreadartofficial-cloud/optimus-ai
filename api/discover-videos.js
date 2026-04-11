export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Please provide a search query" });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeKey) {
    return res.status(500).json({ error: "YouTube API key not configured." });
  }

  try {
    // Step 1: Search for short-form videos in this niche
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=${encodeURIComponent(query + " shorts")}&maxResults=24&order=viewCount&key=${youtubeKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.error) {
      throw new Error(searchData.error.message || "YouTube API error");
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({ videos: [] });
    }

    // Step 2: Get detailed video stats (views, likes, comments, duration)
    const videoIds = searchData.items.map(item => item.id.videoId).filter(Boolean).join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${youtubeKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    if (statsData.error) {
      throw new Error(statsData.error.message || "YouTube API error");
    }

    // Step 3: Get channel stats for all unique channels (to calculate outlier scores)
    const channelIds = [...new Set((statsData.items || []).map(v => v.snippet.channelId))];
    const channelStatsMap = {};

    if (channelIds.length > 0) {
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds.join(",")}&key=${youtubeKey}`;
      const chRes = await fetch(chUrl);
      const chData = await chRes.json();

      if (chData.items) {
        for (const ch of chData.items) {
          const subCount = parseInt(ch.statistics.subscriberCount) || 0;
          const videoCount = parseInt(ch.statistics.videoCount) || 0;
          const viewCount = parseInt(ch.statistics.viewCount) || 0;
          // Estimate avg views per video as a rough baseline
          const avgViews = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;
          channelStatsMap[ch.id] = {
            name: ch.snippet.title,
            thumbnail: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || "",
            subscribers: subCount,
            subscribersFormatted: formatNumber(subCount),
            avgViews,
          };
        }
      }
    }

    // Step 4: Format videos with outlier scores
    const videos = (statsData.items || []).map(v => {
      const views = parseInt(v.statistics.viewCount) || 0;
      const likes = parseInt(v.statistics.likeCount) || 0;
      const comments = parseInt(v.statistics.commentCount) || 0;
      const duration = parseDuration(v.contentDetails.duration);
      const channelId = v.snippet.channelId;
      const channelInfo = channelStatsMap[channelId] || {};
      const avgViews = channelInfo.avgViews || 1;

      // Outlier score = how many times more views than the channel's average
      const outlierScore = avgViews > 0 ? parseFloat((views / avgViews).toFixed(1)) : 0;

      // Extract hook (first sentence of title or description)
      const hook = extractHook(v.snippet.title, v.snippet.description);

      return {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description ? v.snippet.description.substring(0, 200) : "",
        thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || "",
        publishedAt: v.snippet.publishedAt,
        timeAgo: getTimeAgo(v.snippet.publishedAt),
        duration,
        durationFormatted: formatDuration(duration),
        views,
        viewsFormatted: formatNumber(views),
        likes,
        likesFormatted: formatNumber(likes),
        comments,
        commentsFormatted: formatNumber(comments),
        outlierScore,
        hook,
        channel: {
          id: channelId,
          name: channelInfo.name || v.snippet.channelTitle,
          thumbnail: channelInfo.thumbnail || "",
          subscribers: channelInfo.subscribersFormatted || "N/A",
          subscriberCount: channelInfo.subscribers || 0,
        },
        url: `https://www.youtube.com/shorts/${v.id}`,
        platform: "YouTube Shorts",
      };
    });

    // Filter to only short-form (<=60s) and sort by outlier score
    const shorts = videos.filter(v => v.duration <= 180); // include up to 3 min for Shorts
    shorts.sort((a, b) => b.outlierScore - a.outlierScore);

    return res.json({ videos: shorts });
  } catch (err) {
    console.error("Discover videos error:", err);
    return res.status(500).json({ error: err.message || "Failed to discover videos" });
  }
}

function extractHook(title, description) {
  // Use the title as the hook — it's usually the hook for Shorts
  if (title) return title;
  if (description) {
    const firstSentence = description.split(/[.!?]/)[0];
    return firstSentence.substring(0, 120);
  }
  return "";
}

function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1]) || 0) * 3600 + (parseInt(match[2]) || 0) * 60 + (parseInt(match[3]) || 0);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}
