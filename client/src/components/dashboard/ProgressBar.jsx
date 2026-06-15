import React from "react";
import { useApp } from "../../context/AppContext";

const ProgressBar = ({
  isSidebar
}) => {
  const { progressState, setProgressState } = useApp();

  if (!progressState.show) return null;

  return (
    <div className={`${isSidebar ? "absolute" : "fixed"} bottom-24 left-4 right-4 z-40 max-w-md mx-auto transform transition-all duration-300`}>
      <div className="glass-panel rounded-2xl p-3.5 flex items-center justify-between gap-4 border border-white/10 shadow-2xl bg-stone-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 flex items-center justify-center border border-white/5 text-[#C1121F]">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white truncate max-w-[180px]">{progressState.fileName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {progressState.type === "upload" ? "Uploading to Telegram..." : "Downloading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-[#C1121F]">{progressState.progress}%</span>
          <div className="relative w-8 h-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#C1121F"
                strokeWidth="3"
                strokeDasharray={75.4}
                strokeDashoffset={75.4 - (75.4 * progressState.progress) / 100}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
