import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { clearAllCache, getDatabaseStats } from "../../services/indexedDB";

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const SettingsTab = ({
  isSidebar,
  desktopRightView,
  setDesktopRightView
}) => {
  const { user, logoutUser, showToast } = useApp();
  const [isClearing, setIsClearing] = useState(false);
  const [dbStats, setDbStats] = useState({ totalSize: 0, thumbnailsCount: 0, fullImagesCount: 0 });

  const fetchDbStats = async () => {
    try {
      const stats = await getDatabaseStats();
      setDbStats(stats);
    } catch (err) {
      console.error("Failed to load IndexedDB stats:", err);
    }
  };

  useEffect(() => {
    fetchDbStats();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const success = await clearAllCache();
      if (success) {
        showToast("Local cache cleared successfully!", "success");
        await fetchDbStats();
      } else {
        showToast("Failed to clear local cache.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error clearing cache.", "error");
    } finally {
      // Add a slight visual delay for feedback
      setTimeout(() => {
        setIsClearing(false);
      }, 500);
    }
  };

  return (
    <div className={`flex flex-col gap-6 flex-grow w-full ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : "max-w-sm mx-auto justify-center"}`}>
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border-2 border-white/20 text-xl font-bold text-white uppercase shadow-md">
          {user?.phone?.substring(1, 3) || "U"}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white">{user?.phone || "TeleCloud User"}</p>
          <p className="text-[10px] text-gray-400 tracking-wide font-medium">JWT SECURE PHONE SESSION</p>
        </div>

        {/* Local Storage Cache Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Cache Footprint</span>
            <span className="text-[#C1121F] font-extrabold tracking-wider">IndexedDB</span>
          </div>
          
          <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#C1121F] to-[#780001] rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.max(2, (dbStats.totalSize / (50 * 1024 * 1024)) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
            <div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase">Cache Size</p>
              <p className="text-xs font-black text-white mt-0.5">{formatBytes(dbStats.totalSize)}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase">Thumbnails</p>
              <p className="text-xs font-black text-white mt-0.5">{dbStats.thumbnailsCount}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-extrabold uppercase">Originals</p>
              <p className="text-xs font-black text-white mt-0.5">{dbStats.fullImagesCount}</p>
            </div>
          </div>
        </div>

        {/* Cache Control Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Local Cache</span>
            <span className="text-[#FEF0D5]/60 font-semibold lowercase">IndexedDB Cache</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            Manually purge locally cached documents, original images, and metadata. Your user session cookie will remain untouched.
          </p>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className="w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/30 text-orange-400 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                </svg>
                <span>Purging cache...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Purge IndexedDB Cache</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={logoutUser}
          className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-98"
        >
          Logout Session
        </button>

        {/* Devices Option */}
        {isSidebar && (
          <button
            type="button"
            onClick={() => setDesktopRightView(desktopRightView === "devices" ? "folder" : "devices")}
            className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer active:scale-98 mt-2"
          >
            {desktopRightView === "devices" ? "Show Active Folder" : "View Connected Devices"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
