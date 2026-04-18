import { useState, useEffect } from "react";
import {
  Settings, Users, Video, Lightbulb, PenTool, FolderOpen, Archive,
  UserCircle, HelpCircle,
} from "lucide-react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { SAMPLE_WATCHLIST } from "./utils/sampleData";
import { ChannelsPage } from "./pages/ChannelsPage";
import { VideosPage } from "./pages/VideosPage";
import { ScriptsPage } from "./pages/ScriptsPage";
import { IdeasPage } from "./pages/IdeasPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ExportsPage } from "./pages/ExportsPage";
import { PersonaPage } from "./pages/PersonaPage";
import { SettingsPage } from "./pages/SettingsPage";

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
      { id: "projects", label: "Projects", icon: FolderOpen },
      { id: "exports", label: "Exports", icon: Archive },
    ]
  },
  {
    title: "Configure",
    items: [
      { id: "channels", label: "Channels", icon: Users },
      { id: "persona", label: "Persona", icon: UserCircle },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("videos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchlist, setWatchlist] = useState(() => loadFromStorage(STORAGE_KEYS.watchlist, SAMPLE_WATCHLIST));
  const [savedVideos, setSavedVideos] = useState(() => loadFromStorage(STORAGE_KEYS.savedVideos, []));

  useEffect(() => { saveToStorage(STORAGE_KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.savedVideos, savedVideos); }, [savedVideos]);

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
          {currentPage === "channels" && <ChannelsPage watchlist={watchlist} setWatchlist={setWatchlist} />}
          {currentPage === "videos" && <VideosPage watchlist={watchlist} savedVideos={savedVideos} setSavedVideos={setSavedVideos} setCurrentPage={setCurrentPage} />}
          {currentPage === "scripts" && <ScriptsPage savedVideos={savedVideos} />}
          {currentPage === "ideas" && <IdeasPage savedVideos={savedVideos} setCurrentPage={setCurrentPage} />}
          {currentPage === "projects" && <ProjectsPage savedVideos={savedVideos} savedScripts={loadFromStorage(STORAGE_KEYS.savedScripts, [])} />}
          {currentPage === "exports" && <ExportsPage />}
          {currentPage === "persona" && <PersonaPage />}
          {currentPage === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
