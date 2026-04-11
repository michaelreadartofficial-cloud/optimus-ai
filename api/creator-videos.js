export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { creatorId, uploadsPlaylistId, platform } = req.body;

  if (!creatorId) {
    return res.status(400).json({ error: "Please provide a creator ID" });
  }

  if (platform === "TikTok" || platform === "Instagram Reels") {
    return res.status(400).json({
      error: `${platform} video pulling is coming soon. YouTube Shorts is available now.`
    });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return res.status(500).json({ error: "YouTube API key not configured." });
  }

  try {
    // Step 1: Get the uploads playlist ID if not provided
    let playlistId = uploadsPlaylistId;
    if (!playlistId) {
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${creatorId}&key=${youtubeKey}`;
      const chRes = await fetch(chUrl);
      const chData = await chRes.json();
      if (chData.items && chData.items.length > 0) {
        playlistId = chData.items[0].contentDetails.relatedPlaylists.uploads;
      } else {
        return res.status(404).json({ error: "Creator not found" });
      }
    }

    // Step 2: Get recent videos from the uploads playlist (up to 50)
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${youtubeKey}`;
    const plRes = await fetch(plUrl);
    const plData = await plRes.json();

    if (plData.error) {
      throw new Error(plData.error.message || "YouTube API error");
    }

    if (!plData.items || plData.items.length === 0) {
      return res.json({ videos: [], stats: {} });
    }

    // Step 3: Get detailed video stats (views, likes, duration)
    const videoIds = plData.items.map(item => item.snippet.resourceId.videoId).join(",");
    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${youtubeKey}`;
    const vRes = await fetch(vUrl);
    const vData = await vRes.json();

    if (vData.error) {
      throw new Error(vData.error.message || "YouTube API error");
    }

    // Step 4: Parse all videos and identify Shorts (duration <= 60s)
    const allVideos = (vData.items || []).map(v => {
      const duration = parseDuration(v.contentDetails.duration);
      const views = parseInt(v.statistics.viewCount) || 0;
      const likes = parseInt(v.statistics.likeCount) || 0;
      const comments = parseInt(v.statistics.commentCount) || 0;
      return {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description ? v.snippet.description.substring(0, 300) : "",
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
        publishedAt: v.snippet.publishedAt,
        duration: duration,
        durationFormatted: formatDuration(duration),
        isShort: duration <= 60,
        views,
        likes,
        comments,
        viewsFormatted: formatNumber(views),
        likesFormatted: formatNumber(likes),
        commentsFormatted: formatNumber(comments),
        url: `https://www.youtube.com/shorts/${v.id}`,
      };
    });

    // Step 5: Filter to Shorts only
    const shorts = allVideos.filter(v => v.isShort);
    const longForm = allVideos.filter(v => !v.isShort);

    // If no shorts found, use all videos (some channels don't use Shorts format)
    const videosToAnalyze = shorts.length >= 3 ? shorts : allVideos;

    // Step 6: Calculate outlier scores
    const totalViews = videosToAnalyze.reduce((sum, v) => sum + v.views, 0);
    const avgViews = videosToAnalyze.length > 0 ? totalViews / videosToAnalyze.length : 0;
    const medianViews = getMedian(videosToAnalyze.map(v => v.views));

    const videosWithScores = videosToAnalyze.map(v => ({
      ...v,
      outlierScore: avgViews > 0 ? parseFloat((v.views / avgViews).toFixed(1)) : 0,
      outlierVsMedian: medianViews > 0 ? parseFloat((v.views / medianViews).toFixed(1)) : 0,
    }));

    // Sort by outlier score descending
    videosWithScores.sort((a, b) => b.outlierScore - a.outlierScore);

    // Step 7: Compile channel stats
    const stats = {
      totalVideos: allVideos.length,
      shortsCount: shorts.length,
      longFormCount: longForm.length,
      avgViews: formatNumber(Math.round(avgViews)),
      avgViewsRaw: Math.round(avgViews),
      medianViews: formatNumber(Math.round(medianViews)),
      medianViewsRaw: Math.round(medianViews),
      topOutlierScore: videosWithScores.length > 0 ? videosWithScores[0].outlierScore : 0,
    };

    return res.json({ videos: videosWithScores, stats });
  } catch (err) {
    console.error("Creator videos error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch creator videos" });
  }
}

// Parse ISO 8601 duration (PT1M30S) to seconds
function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
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

function getMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
