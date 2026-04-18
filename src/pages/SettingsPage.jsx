import { Key } from "lucide-react";

export const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Account</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" defaultValue="michael@example.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" defaultValue="Michael" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
          Save Changes
        </button>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Preferences</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Get notified about new outliers</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
            <p className="text-xs text-gray-500 mt-0.5">Receive weekly summary of trending content</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">API Keys</h2>
      <p className="text-xs text-gray-500 mb-3">Configure API keys in your Vercel environment variables for full functionality.</p>
      <div className="space-y-3">
        {["YOUTUBE_API_KEY", "RAPIDAPI_KEY", "ANTHROPIC_API_KEY"].map(key => (
          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-gray-400" />
              <span className="text-sm font-mono text-gray-700">{key}</span>
            </div>
            <span className="text-xs text-gray-400">Set in Vercel</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
