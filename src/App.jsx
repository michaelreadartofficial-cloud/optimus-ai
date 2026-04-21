import { useState, useEffect } from "react";
import {
  Settings, Users, Video, Lightbulb, PenTool,
  UserCircle, HelpCircle, MoreHorizontal, X, Plus,
} from "lucide-react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useIsMobile } from "./utils/useIsMobile";
import { ChannelsPage } from "./pages/ChannelsPage";
import { VideosPage } from "./pages/VideosPage";
import { ScriptsPage } from "./pages/ScriptsPage";
import { IdeasPage } from "./pages/IdeasPage";
import { PersonaPage } from "./pages/PersonaPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FilmPage } from "./pages/FilmPage";

const NAV_SECTIONS = [
  {
    title: "Research",
    items: [
      { id: "videos", label: "Videos", icon: Video },
      { id: "ideas", label: "Ideas", icon: Lightbulb },
    ]
  },
  {
    title: "Create",
    items: [
      { id: "scripts", label: "Scripts", icon: PenTool },
    ]
  },
  {
    title: "Configure",
    items: [
      { id: "creators", label: "Creators", icon: Users },
      { id: "account", label: "My Account", icon: UserCircle },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  },
];

// Mobile bottom-tab nav. Five slots, including an overflow "More" sheet
// that currently holds Account + Settings.
const MOBILE_PRIMARY_TABS = [
  { id: "videos", label: "Videos", icon: Video },
  { id: "scripts", label: "Scripts", icon: PenTool },
  { id: "creators", label: "Creators", icon: Users },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
];

// Pages that live in the mobile "More" overflow sheet.
const MOBILE_MORE_ITEMS = [
  { id: "account", label: "My Account", icon: UserCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("videos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Active filming session — when set, we render the FilmPage fullscreen
  // and suppress the normal app chrome. Only reachable on mobile.
  const [filmingScript, setFilmingScript] = useState(null);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  // Detect whether the PWA is running in standalone mode (installed to
  // home screen). Non-standalone on iOS means Safari's URL bar is
  // visible at the bottom — which is where our "install for full screen"
  // prompt becomes relevant.
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    const displayModeStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    // iOS reports standalone via navigator.standalone (non-standard).
    const iosStandalone = typeof navigator !== "undefined" && navigator.standalone === true;
    return displayModeStandalone || iosStandalone;
  });
  const [installPromptDismissed, setInstallPromptDismissed] = useState(() => {
    try { return localStorage.getItem("optimus_install_prompt_dismissed") === "1"; } catch { return false; }
  });
  const showInstallPrompt = isMobile && !isStandalone && !installPromptDismissed;
  const dismissInstallPrompt = () => {
    setInstallPromptDismissed(true);
    try { localStorage.setItem("optimus_install_prompt_dismissed", "1"); } catch {}
  };

  const [watchlist, setWatchlist] = useState(() => {
    // Load watchlist from storage. If storage contains legacy SAMPLE_WATCHLIST
    // entries (fake demo creators with IDs like "yt_1"), filter them out —
    // they would fail every API call and block real results.
    const raw = loadFromStorage(STORAGE_KEYS.watchlist, []);
    return Array.isArray(raw)
      ? raw.filter(w => w && w.id && !/^yt_\d+$/.test(String(w.id)))
      : [];
  });
  const [savedVideos, setSavedVideos] = useState(() => loadFromStorage(STORAGE_KEYS.savedVideos, []));

  useEffect(() => { saveToStorage(STORAGE_KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.savedVideos, savedVideos); }, [savedVideos]);

  // If the user rotates to desktop mid-session, close the mobile More sheet
  // so it doesn't get stranded open.
  useEffect(() => { if (!isMobile) setMoreSheetOpen(false); }, [isMobile]);

  // --- Fullscreen Film Now route — overrides all normal app chrome. ---
  if (filmingScript) {
    return (
      <FilmPage
        script={filmingScript}
        onExit={() => setFilmingScript(null)}
      />
    );
  }

  const pageContent = (
    <>
      {currentPage === "creators" && <ChannelsPage watchlist={watchlist} setWatchlist={setWatchlist} />}
      {currentPage === "videos" && <VideosPage watchlist={watchlist} savedVideos={savedVideos} setSavedVideos={setSavedVideos} setCurrentPage={setCurrentPage} />}
      {currentPage === "scripts" && <ScriptsPage savedVideos={savedVideos} onFilmScript={isMobile ? setFilmingScript : null} />}
      {currentPage === "ideas" && <IdeasPage savedVideos={savedVideos} setCurrentPage={setCurrentPage} />}
      {currentPage === "account" && <PersonaPage />}
      {currentPage === "settings" && <SettingsPage />}
    </>
  );

  // --- Mobile layout: bottom tab bar, no sidebar. ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Scrollable page body — padded so the fixed bottom tab bar never
            overlaps content, and topped with a slim header showing app name. */}
        <div className="flex-1 overflow-y-auto pt-safe">
          <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-500 rounded-md flex items-center justify-center text-white font-bold text-xs">O</div>
            <span className="font-bold text-gray-900 text-sm">Optimus.AI</span>
          </div>
          {/* One-time dismissable install prompt shown when running in a
              mobile browser tab (not installed to home screen). On iOS,
              installing removes Safari's URL bar and gives a proper
              fullscreen app feel. */}
          {showInstallPrompt && (
            <div className="mx-4 mt-3 p-3 bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                <Plus size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">Install for the best experience</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                  In Safari, tap the <span className="font-medium">Share</span> button then <span className="font-medium">Add to Home Screen</span>. Removes the browser bar and makes Film Now fullscreen.
                </p>
              </div>
              <button onClick={dismissInstallPrompt} className="p-1 -m-1 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="px-4 py-4 pb-24">
            {pageContent}
          </div>
        </div>

        {/* Fixed bottom tab bar with safe-area padding for home indicator. */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
          <div className="flex items-stretch">
            {MOBILE_PRIMARY_TABS.map((tab) => {
              const active = currentPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentPage(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                    active ? "text-gray-900" : "text-gray-400"
                  }`}>
                  <tab.icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setMoreSheetOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                MOBILE_MORE_ITEMS.some(i => i.id === currentPage) ? "text-gray-900" : "text-gray-400"
              }`}>
              <MoreHorizontal size={22} strokeWidth={1.75} />
              <span>More</span>
            </button>
          </div>
        </nav>

        {/* "More" overflow sheet — pages that didn't fit in the bottom bar. */}
        {moreSheetOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setMoreSheetOpen(false)}>
            <div
              className="bg-white w-full rounded-t-2xl pb-safe"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">More</h3>
                <button onClick={() => setMoreSheetOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="py-1">
                {MOBILE_MORE_ITEMS.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setCurrentPage(item.id); setMoreSheetOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        active ? "bg-gray-50 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}>
                      <item.icon size={18} className="text-gray-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Desktop layout: the original sidebar design, unchanged. ---
  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? "w-56" : "w-16"} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col`}>
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">O</div>
          </button>
          {sidebarOpen && <span className="font-bold text-gray-900 text-sm">Optimus.AI</span>}
        </div>

        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              {sidebarOpen && (
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{section.title}</h3>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                      currentPage === item.id
                        ? "bg-gray-100 text-gray-900 font-semibold"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title={item.label}>
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-3 border-t border-gray-100">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <HelpCircle size={18} /> <span>Help Center</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px]">
          {pageContent}
        </div>
      </div>
    </div>
  );
}
