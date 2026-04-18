import { Archive } from "lucide-react";

export const ExportsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-900">Exports</h1>
      <p className="text-sm text-gray-500 mt-1">Download your saved videos, scripts and transcripts</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
      <Archive size={32} className="text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700">No exports yet</p>
      <p className="text-xs text-gray-500 mt-1">Scripts you export from the Scripts page will show up here</p>
    </div>
  </div>
);
