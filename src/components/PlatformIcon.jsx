// Brand-accurate platform logos.
// - Instagram: gradient camera glyph (official-style)
// - TikTok:    black square with the musical-note logo
// - YouTube Shorts: red rounded-rect with a lightning-style play

const InstagramLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <defs>
      <radialGradient id="ig-grad" cx="0.3" cy="1.1" r="1.2">
        <stop offset="0" stopColor="#FEDA77" />
        <stop offset="0.25" stopColor="#F58529" />
        <stop offset="0.5" stopColor="#DD2A7B" />
        <stop offset="0.75" stopColor="#8134AF" />
        <stop offset="1" stopColor="#515BD4" />
      </radialGradient>
    </defs>
    <rect x="1.5" y="1.5" width="21" height="21" rx="6" ry="6" fill="url(#ig-grad)" />
    <rect x="4.5" y="4.5" width="15" height="15" rx="4" ry="4" fill="none" stroke="#fff" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="1.6" />
    <circle cx="17" cy="7" r="1.1" fill="#fff" />
  </svg>
);

const TikTokLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="22" height="22" rx="5" fill="#000" />
    {/* cyan back layer */}
    <path d="M15.2 6.5v7.6a3.1 3.1 0 1 1-3.1-3.1v2.1a1 1 0 1 0 1 1V4.5h2.1a4 4 0 0 0 4 4v2.1"
      fill="#25F4EE" transform="translate(-0.9, 0.9)" />
    {/* pink front layer */}
    <path d="M15.2 6.5v7.6a3.1 3.1 0 1 1-3.1-3.1v2.1a1 1 0 1 0 1 1V4.5h2.1a4 4 0 0 0 4 4v2.1"
      fill="#FE2C55" transform="translate(0.9, -0.9)" />
    {/* white top */}
    <path d="M15.2 6.5v7.6a3.1 3.1 0 1 1-3.1-3.1v2.1a1 1 0 1 0 1 1V4.5h2.1a4 4 0 0 0 4 4v2.1" fill="#fff" />
  </svg>
);

const YouTubeShortsLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="yts-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF0033" />
        <stop offset="1" stopColor="#D90429" />
      </linearGradient>
    </defs>
    {/* Rounded rectangle "shorts" body */}
    <path d="M12 2.5c-1 0-2 .3-2.7.8L5 6a4 4 0 0 0-1.9 3.4v5.2A4 4 0 0 0 5 18l4.3 2.7a5.2 5.2 0 0 0 5.4 0L19 18a4 4 0 0 0 1.9-3.4V9.4A4 4 0 0 0 19 6l-4.3-2.7c-.7-.5-1.7-.8-2.7-.8z"
      fill="url(#yts-grad)" />
    {/* Lightning/play triangle */}
    <path d="M10 8v3.2H7.6L14 16v-3.2h2.4L10 8z" fill="#fff" />
  </svg>
);

const FallbackDot = ({ size = 20 }) => (
  <span style={{
    width: size, height: size, borderRadius: "50%", backgroundColor: "#999",
    color: "white", fontSize: size * 0.42, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  }}>?</span>
);

export const PlatformIcon = ({ platform, size = 20 }) => {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram")) return <InstagramLogo size={size} />;
  if (p.includes("tiktok"))    return <TikTokLogo size={size} />;
  if (p.includes("youtube"))   return <YouTubeShortsLogo size={size} />;
  return <FallbackDot size={size} />;
};

export const PlatformBadge = ({ platform }) => {
  const p = (platform || "").toLowerCase();
  const name = p.includes("instagram") ? "Instagram"
             : p.includes("tiktok")    ? "TikTok"
             : p.includes("youtube")   ? "YouTube Shorts"
             : platform;
  const color = p.includes("instagram") ? "#DD2A7B"
              : p.includes("tiktok")    ? "#000000"
              : p.includes("youtube")   ? "#FF0033"
              : "#666";
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(255,255,255,0.95)", color, backdropFilter: "blur(4px)" }}>
      <PlatformIcon platform={platform} size={14} />
      {name}
    </div>
  );
};
