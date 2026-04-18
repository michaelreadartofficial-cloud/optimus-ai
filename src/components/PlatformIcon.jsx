export const PlatformIcon = ({ platform, size = 20 }) => {
  const isIG = platform?.toLowerCase().includes("instagram");
  const isTT = platform?.toLowerCase().includes("tiktok");
  const isYT = platform?.toLowerCase().includes("youtube");
  const color = isIG ? "#E1306C" : isTT ? "#000000" : isYT ? "#FF0000" : "#999";
  const label = isIG ? "IG" : isTT ? "TT" : isYT ? "YT" : "?";
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", backgroundColor: color,
      color: "white", fontSize: size * 0.42, fontWeight: 700,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>{label}</span>
  );
};

export const PlatformBadge = ({ platform }) => {
  const isIG = platform?.toLowerCase().includes("instagram");
  const isTT = platform?.toLowerCase().includes("tiktok");
  const isYT = platform?.toLowerCase().includes("youtube");
  const name = isIG ? "Instagram" : isTT ? "TikTok" : isYT ? "YouTube Shorts" : platform;
  const color = isIG ? "#E1306C" : isTT ? "#000000" : isYT ? "#FF0000" : "#666";
  const label = isIG ? "IG" : isTT ? "TT" : isYT ? "YT" : "?";
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(255,255,255,0.9)", color, backdropFilter: "blur(4px)" }}>
      <span style={{
        width: 14, height: 14, borderRadius: "50%", backgroundColor: color,
        display: "inline-flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "white", fontSize: 7, fontWeight: 700 }}>{label}</span>
      </span>
      {name}
    </div>
  );
};
