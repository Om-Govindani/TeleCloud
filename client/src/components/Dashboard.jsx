import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

const Dashboard = ({ 
  onCreateFolderClick, 
  onCreateCategoryClick, 
  isSidebar = false, 
  onFolderSelect,
  desktopRightView,
  setDesktopRightView 
}) => {
  const {
    folders,
    categories,
    searchQuery,
    setSearchQuery,
    selectFolder,
    logoutUser,
    user,
    progressState,
    isOffline,
    activeFolder,
  } = useApp();

  const handleFolderClick = (folder) => {
    selectFolder(folder);
    if (onFolderSelect) onFolderSelect(folder);
  };

  const [activeTab, setActiveTab] = useState("my-folders"); // "my-folders" | "shared-with-me" | "categories" | "settings"
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  
  // Custom merging search bar state
  const [isSearching, setIsSearching] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFolderName = (title) => {
    if (!title) return "";
    return title.split("::")[0];
  };

  const getFolderCategory = (title) => {
    if (!title) return "General";
    const parts = title.split("::");
    return parts[1] || "General";
  };

  const currentFoldersList = activeTab === "my-folders" ? folders.myFolders : folders.sharedWithMe;

  const filteredFolders = currentFoldersList.filter((folder) => {
    const rawName = getFolderName(folder.title);
    const category = folder.category || getFolderCategory(folder.title);
    
    const matchesSearch = rawName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "All" || category === selectedCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`relative flex flex-col animate-fade-in ${
      isSidebar 
        ? "h-full w-full pt-20 pb-28 overflow-hidden bg-transparent" 
        : "min-h-screen pb-32 p-4 md:p-6 max-w-6xl mx-auto"
    }`}>
      {/* Background Liquid Bubbles */}
      {!isSidebar && (
        <div className="bg-liquid-glow">
          <div className="bg-bubble bg-bubble-1"></div>
          <div className="bg-bubble bg-bubble-2"></div>
          <div className="bg-bubble bg-bubble-3"></div>
        </div>
      )}

      {/* TOP CAPSULE NAV BAR (Liquid glass merging search experience) */}
      <header className={`z-40 bg-transparent border-none backdrop-blur-none py-3 ${
        isSidebar 
          ? "absolute top-0 left-0 right-0 px-4" 
          : "sticky top-0 -mx-4 md:-mx-6 px-4 md:px-6 mb-6"
      }`}>
        <div className="relative h-12 w-full">
          {/* INITIAL MODE: Shows Left Profile circle, Center TeleCloud branding (expanded), Right Search+Settings capsule */}
          <div className={`absolute inset-0 w-full flex items-center justify-between gap-3 transition-all duration-300 ease-out ${
            isSearching ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          }`}>
            {/* Left circular avatar/profile button */}
            <button
              onClick={() => setActiveTab("settings")}
              className="w-12 h-12 rounded-full glass-panel flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg text-[#FEF0D5] hover:text-white flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border border-white/10 text-xs font-black text-white">
                {user?.phone?.substring(1, 3) || "U"}
              </div>
            </button>

            {/* App branding capsule - expanded to cover remaining space */}
            <div className="flex-grow glass-panel rounded-full px-5 h-12 flex items-center justify-center gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border border-white/10 text-white shadow-sm flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <span className="text-sm font-extrabold text-[#FEF0D5] tracking-wide">TeleCloud</span>
              </div>
              
              {isOffline && (
                <div className="absolute right-4 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  Offline
                </div>
              )}
            </div>

            {/* Combined Search + Menu Capsule */}
            <div className="glass-panel rounded-full h-12 px-2 flex items-center gap-1 shadow-lg flex-shrink-0">
              {/* Search trigger button */}
              <button
                onClick={() => setIsSearching(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-90 transition-all text-[#FEF0D5]"
                title="Search"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Separator line */}
              <div className="w-[1px] h-5 bg-white/10"></div>

              {/* Settings/Dropdown options button */}
              <button
                onClick={() => setActiveTab("settings")}
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-90 transition-all text-[#FEF0D5]"
                title="Settings"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* SEARCH MODE ACTIVE: Merged layout containing Left Category select, Center search, Right close */}
          <div className={`absolute inset-0 w-full flex items-center justify-between gap-2.5 transition-all duration-300 ease-out ${
            isSearching ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}>
            {/* Left Category Selection capsule */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`h-12 px-4 rounded-full glass-panel flex items-center justify-center gap-1.5 cursor-pointer active:scale-90 transition-all shadow-lg ${
                  selectedCategoryFilter !== "All" ? "border-[#C1121F]/40 bg-[#C1121F]/10" : ""
                }`}
              >
                <svg className="w-4 h-4 text-[#FEF0D5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-[10px] font-bold text-[#FEF0D5] uppercase tracking-wider">
                  {selectedCategoryFilter === "All" ? "Category" : selectedCategoryFilter}
                </span>
              </button>
              
              {/* Categories Dropdown Popover */}
              {showCategoryDropdown && (
                <div className="absolute left-0 mt-2 w-48 rounded-2xl glass-panel-heavy p-1.5 shadow-2xl z-50 flex flex-col gap-1 border border-white/10">
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter("All");
                      setShowCategoryDropdown(false);
                    }}
                    className={`text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                      selectedCategoryFilter === "All" ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategoryFilter(cat.name);
                        setShowCategoryDropdown(false);
                      }}
                      className={`text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        selectedCategoryFilter === cat.name ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Center Capsule Search Input */}
            <div className="flex-grow relative glass-panel rounded-full flex items-center px-4 h-12 shadow-lg">
              <svg className="w-4 h-4 text-[#FEF0D5]/50 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-[#FEF0D5] placeholder-[#FEF0D5]/35 text-xs font-semibold outline-none focus:outline-none py-1"
                autoFocus={isSearching}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Right Exit Search button */}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryFilter("All");
                setIsSearching(false);
              }}
              className="w-12 h-12 rounded-full glass-panel flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg text-white"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT PANEL */}

      {/* View: Folders Grid */}
      {(activeTab === "my-folders" || activeTab === "shared-with-me") && (
        <div className={`flex flex-col gap-6 flex-grow ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : ""}`}>
          {filteredFolders.length > 0 ? (
            <div className="flex flex-col gap-3 w-full pb-4">
              {filteredFolders.map((folder) => {
                const isShared = folder.members?.length > 0;
                const isSelected = activeFolder && activeFolder._id === folder._id;
                
                return (
                  <div
                    key={folder._id}
                    onClick={() => handleFolderClick(folder)}
                    className={`glass-card rounded-2xl p-4 flex items-center justify-between cursor-pointer relative overflow-hidden group select-none w-full transition-all duration-200 ${
                      isSelected
                        ? "border-[#C1121F] bg-[#C1121F]/10 shadow-md shadow-[#C1121F]/10 text-white"
                        : "border-white/5 hover:border-[#FEF0D5]/20 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      {/* Folder Icon Bubble (Crimson Blaze colored gradients) */}
                      <div className={`p-3 rounded-xl bg-gradient-to-tr from-[#C1121F]/10 to-[#780001]/10 border text-[#C1121F] group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ${
                        isSelected ? "border-[#C1121F]/40" : "border-white/5"
                      }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
 
                      {/* Meta info */}
                      <div>
                        <p className={`text-sm font-bold transition-colors duration-150 ${
                          isSelected ? "text-[#C1121F]" : "text-[#FEF0D5] group-hover:text-[#C1121F]"
                        }`}>
                          {getFolderName(folder.title)}
                        </p>
                        <span className="inline-block mt-0.5 text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-wider">
                          {folder.category || getFolderCategory(folder.title)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Shared Badge */}
                      {(activeTab === "shared-with-me" || isShared) && (
                        <div className="px-2.5 py-1 rounded-full bg-[#C1121F]/15 border border-[#C1121F]/30 text-[#FEF0D5] text-[9px] font-bold tracking-wider uppercase">
                          {activeTab === "shared-with-me" ? "Shared" : "Collab"}
                        </div>
                      )}
                      
                      {/* Right Arrow */}
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-[#FEF0D5] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow py-16 text-center gap-4">
              <div className="p-4 bg-white/2 rounded-full border border-white/5 text-gray-600">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-gray-300">No folders found</p>
                <p className="text-xs text-gray-500 max-w-xs px-4">
                  {searchQuery || selectedCategoryFilter !== "All"
                    ? "Adjust your search filters to show matching folders."
                    : "Create a new folder to start using private Telegram storage buckets."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View: Categories list */}
      {activeTab === "categories" && (
        <div className={`flex flex-col gap-6 flex-grow w-full ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : "max-w-md mx-auto"}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Categories</h2>
            <button
              onClick={onCreateCategoryClick}
              className="px-3.5 py-2 rounded-xl bg-[#C1121F]/10 hover:bg-[#C1121F]/20 border border-[#C1121F]/20 hover:border-[#C1121F]/30 text-[#FEF0D5] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              + Add New
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="glass-card rounded-2xl p-4 flex justify-between items-center border border-white/5"
              >
                <span className="text-sm font-semibold text-gray-200">{cat.name}</span>
                <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-gray-500 font-bold uppercase tracking-wide">
                  Category
                </span>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-8">No user-defined categories yet.</p>
            )}
          </div>
        </div>
      )}

      {/* View: Settings */}
      {activeTab === "settings" && (
        <div className={`flex flex-col gap-6 flex-grow w-full ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : "max-w-sm mx-auto justify-center"}`}>
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border-2 border-white/20 text-xl font-bold text-white uppercase shadow-md shadow-indigo-500/10">
              {user?.phone?.substring(1, 3) || "U"}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{user?.phone || "TeleCloud User"}</p>
              <p className="text-[10px] text-gray-400 tracking-wide font-medium">JWT SECURE PHONE SESSION</p>
            </div>

            <button
              onClick={logoutUser}
              className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-98"
            >
              Logout Session
            </button>

            {/* Devices option if desktop/sidebar */}
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
      )}

      {/* BACKGROUND PROGRESS CONTROLLER (Taylor Swift Inspired status player) */}
      {progressState.show && (
        <div className={`${isSidebar ? "absolute" : "fixed"} bottom-24 left-4 right-4 z-40 max-w-md mx-auto transform transition-all duration-300`}>
          <div className="glass-panel rounded-2xl p-3.5 flex items-center justify-between gap-4 border border-white/10 shadow-2xl">
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
      )}

      {/* FLOATING GLASS BOTTOM NAVIGATION TAB-BAR (Reference Mock Inspired with spring deforming indicator backplate) */}
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

          {/* Floating Action Button (FAB) next to Nav Capsule */}
          <button
            onClick={onCreateFolderClick}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/20 shadow-lg shadow-[#C1121F]/20 text-white flex items-center justify-center cursor-pointer active:scale-90 active:rotate-90 hover:scale-105 transition-all duration-200"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
