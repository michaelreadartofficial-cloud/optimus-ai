// Proxy a video URL and serve it as a download.
//
// Why: Instagram's CDN URLs are short-lived signed URLs and are CORS-locked,
// so the browser can't download them directly via <a download>. This proxy
// fetches the video server-side and streams it back to the client with
// Content-Disposition: attachment so the browser saves it as a file.
//
// Usage: GET /api/proxy-video?url=<encoded>&filename=<optional>

export const config = {
  // Larger body size limit for video responses
  api: { responseLimit: false },
};

export default async function handler(req, res) {
  const { url, filename } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });

  const safeName = sanitizeFilename(filename || "instagram-reel.mp4");

  try {
    const videoRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({
        error: `Upstream returned ${videoRes.status}. The video URL may have expired — try re-saving it from the feed.`,
      });
    }

    const contentType = videoRes.headers.get("content-type") || "video/mp4";
    const contentLength = videoRes.headers.get("content-length");
    const buffer = Buffer.from(await videoRes.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Cache-Control", "no-store");
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to proxy video" });
  }
}

function sanitizeFilename(name) {
  // Strip anything weird so the browser won't reject the Content-Disposition
  return String(name).replace(/[^\w\-. ]/g, "_").slice(0, 100) || "video.mp4";
}
