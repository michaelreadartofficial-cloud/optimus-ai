import { AlertCircle, RefreshCw } from "lucide-react";

export const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <AlertCircle size={24} className="text-red-400" />
    <p className="text-sm text-red-500">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
        <RefreshCw size={12} /> Try again
      </button>
    )}
  </div>
);
