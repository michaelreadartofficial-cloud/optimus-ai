import { useEffect, useState } from "react";

// Returns true when the viewport is phone-sized. The breakpoint matches
// Tailwind's `md` breakpoint (768px). We also check touch/pointer so a
// desktop user who makes their browser narrow doesn't get the mobile UI.
export function useIsMobile(breakpoint = 768) {
  const get = () => {
    if (typeof window === "undefined") return false;
    const narrow = window.innerWidth < breakpoint;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    return narrow && coarse;
  };
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const onResize = () => setIsMobile(get());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [breakpoint]);
  return isMobile;
}
