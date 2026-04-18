import { useState, useEffect } from "react";
import { FolderOpen, Plus, ChevronLeft, Trash2, Video, PenTool } from "lucide-react";
import { loadFromStorage, saveToStorage } from "../utils/storage";

export const ProjectsPage = ({ savedVideos, savedScripts }) => {
  const [projects, setProjects] = useState(() => loadFromStorage("optimus_projects", []));
  const [showNew, setShowNew] = useState(false);
  const [openProjectId, setOpenProjectId] = useState(null);
  const [draft, setDraft] = useState({ name: "", description: "", goal: "" });

  useEffect(() => { saveToStorage("optimus_projects", projects); }, [projects]);

  const createProject = () => {
    if (!draft.name.trim()) return;
    const p = { id: Date.now(), ...draft, createdAt: new Date().toISOString(), videoIds: [], scriptIds: [], ideaIds: [] };
    setProjects(prev => [p, ...prev]);
    setDraft({ name: "", description: "", goal: "" });
    setShowNew(false);
  };

  const deleteProject = (id) => {
    if (!window.confirm("Delete this project?")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (openProjectId === id) setOpenProjectId(null);
  };

  const openProject = projects.find(p => p.id === openProjectId);
  const projectVideos = openProject ? (savedVideos || []).filter(v => openProject.videoIds?.includes(v.id)) : [];
  const projectScripts = openProject ? (savedScripts || []).filter(s => openProject.scriptIds?.includes(s.id)) : [];

  if (openProject) {
    return (
      <div>
        <button onClick={() => setOpenProjectId(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={14} /> Back to projects
        </button>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{openProject.name}</h1>
            {openProject.description && <p className="text-sm text-gray-500 mt-1">{openProject.description}</p>}
            {openProject.goal && <p className="text-xs text-gray-400 mt-2">Goal: {openProject.goal}</p>}
          </div>
          <button onClick={() => deleteProject(openProject.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Videos ({projectVideos.length})</h3>
            {projectVideos.length === 0 ? (
              <p className="text-xs text-gray-400">No videos added yet. Save videos to your vault then tag them to this project (coming soon).</p>
            ) : (
              <div className="space-y-2">{projectVideos.map(v => (
                <div key={v.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Video size={12} className="text-gray-400" /> {v.title}
                </div>
              ))}</div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Scripts ({projectScripts.length})</h3>
            {projectScripts.length === 0 ? (
              <p className="text-xs text-gray-400">No scripts added yet.</p>
            ) : (
              <div className="space-y-2">{projectScripts.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <PenTool size={12} className="text-gray-400" /> {s.topic || s.hook}
                </div>
              ))}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Organize winning ideas into collections to speed up your workflow</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0">
          <Plus size={14} /> New project
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">New project</h3>
          <input type="text" value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Project name (e.g. Q2 fitness series)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <input type="text" value={draft.description} onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Short description"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <input type="text" value={draft.goal} onChange={(e) => setDraft(d => ({ ...d, goal: e.target.value }))}
            placeholder="Goal (optional, e.g. Hit 1M views by June)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={createProject} disabled={!draft.name.trim()}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              Create
            </button>
            <button onClick={() => { setShowNew(false); setDraft({ name: "", description: "", goal: "" }); }}
              className="px-3 py-1.5 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showNew && (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
          <FolderOpen size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No projects yet</p>
          <p className="text-xs text-gray-500 mt-1">Projects let you group videos, scripts and ideas for a single content initiative</p>
          <button onClick={() => setShowNew(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={14} /> New project
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(p => (
          <button key={p.id} onClick={() => setOpenProjectId(p.id)}
            className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <FolderOpen size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                  <span>{p.videoIds?.length || 0} videos</span>
                  <span>{p.scriptIds?.length || 0} scripts</span>
                  <span>{p.ideaIds?.length || 0} ideas</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
