import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <Loader2 size={24} className="animate-spin text-gray-400" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);
