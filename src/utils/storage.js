export const STORAGE_KEYS = {
  watchlist: "optimus_watchlist",
  savedVideos: "optimus_saved_videos",
  scriptsWritten: "optimus_scripts_written",
  savedScripts: "optimus_saved_scripts",
};

export const loadFromStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
};

export const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
