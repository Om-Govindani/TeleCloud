import React from "react";

const BottomBar = ({
  activeTab,
  setActiveTab,
  onCreateFolderClick,
  isSidebar
}) => {
  return (
    <div className={`${isSidebar ? "absolute" : "fixed"} bottom-6 left-0 right-0 z-40 px-4 flex justify-center items-center pointer-events-none`}>
      <div className={`flex items-center gap-3 w-full pointer-events-auto ${isSidebar ? "" : "max-w-6xl"}`}>
        {/* Main Floating Navigation Capsule */}
        <div className="flex-grow glass-nav rounded-full px-2 py-2 flex items-center justify-around relative overflow-hidden">
          {/* Sliding spring-deforming liquid glass indicator bubble */}
          <div
            className="absolute top-1.5 bottom-1.5 bg-[#FEF0D5]/10 border border-[#FEF0D5]/15 rounded-full pointer-events-none"
            style={{
              left: activeTab === "my-folders" ? "8px" : activeTab === "shared-with-me" ? "calc(25% + 4px)" : activeTab === "categories" ? "50%" : "calc(75% - 4px)",
              width: "calc(25% - 4px)",
              transition: "left 0.45s cubic-bezier(0.25, 1, 0.5, 1), width 0.45s cubic-bezier(0.25, 1, 0.5, 1)"
            }}
          />

          <button
            onClick={() => setActiveTab("my-folders")}
            className={`flex flex-col items-center justify-center py-2.5 z-10 w-1/4 transition-colors duration-250 cursor-pointer ${
              activeTab === "my-folders" ? "text-[#FEF0D5]" : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider mt-1">My Folders</span>
          </button>

          <button
            onClick={() => setActiveTab("shared-with-me")}
            className={`flex flex-col items-center justify-center py-2.5 z-10 w-1/4 transition-colors duration-250 cursor-pointer ${
              activeTab === "shared-with-me" ? "text-[#FEF0D5]" : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Shared</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex flex-col items-center justify-center py-2.5 z-10 w-1/4 transition-colors duration-250 cursor-pointer ${
              activeTab === "categories" ? "text-[#FEF0D5]" : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Categories</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center py-2.5 z-10 w-1/4 transition-colors duration-250 cursor-pointer ${
              activeTab === "settings" ? "text-[#FEF0D5]" : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Settings</span>
          </button>
        </div>

        {/* Floating Action Button (FAB) */}
        <button
          onClick={onCreateFolderClick}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/20 shadow-lg shadow-[#C1121F]/20 text-white flex items-center justify-center cursor-pointer active:scale-90 active:rotate-90 hover:scale-105 transition-all duration-200 flex-shrink-0"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
