import { useState } from "react";
import { Check } from "lucide-react";
import { loadFromStorage, saveToStorage } from "../utils/storage";

export const PersonaPage = () => {
  const [persona, setPersona] = useState(() => loadFromStorage("optimus_persona", { niche: "", audience: "", voice: "", topics: "" }));
  const [saved, setSaved] = useState(false);

  const update = (k, v) => { setPersona(p => ({ ...p, [k]: v })); setSaved(false); };
  const save = () => { saveToStorage("optimus_persona", persona); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        <p className="text-sm text-gray-500 mt-1">Tell us about the content you make so we can tailor ideas and scripts</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
          <input type="text" value={persona.niche} onChange={(e) => update("niche", e.target.value)}
            placeholder="e.g. AI tools for creators"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <input type="text" value={persona.audience} onChange={(e) => update("audience", e.target.value)}
            placeholder="e.g. solo creators and indie founders"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Voice & tone</label>
          <textarea rows={3} value={persona.voice} onChange={(e) => update("voice", e.target.value)}
            placeholder="e.g. casual, direct, no fluff"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topics you cover</label>
          <textarea rows={2} value={persona.topics} onChange={(e) => update("topics", e.target.value)}
            placeholder="e.g. AI workflows, productivity, startup stories"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            Save persona
          </button>
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Saved</span>}
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-xs text-blue-900 leading-relaxed">
        Your persona is used to tailor ideas on the Ideas page and will soon shape scripts too.
      </div>
    </div>
  );
};
