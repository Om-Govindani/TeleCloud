import React from "react";
import { useApp } from "../../context/AppContext";

const Navbar = ({
  isSidebar,
  isSearching,
  setIsSearching,
  showCategoryDropdown,
  setShowCategoryDropdown,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  dropdownRef,
  setActiveTab
}) => {
  const { user, isOffline, categories, searchQuery, setSearchQuery } = useApp();

  return (
    <header className={`z-40 bg-transparent border-none backdrop-blur-none py-3 ${
      isSidebar 
        ? "absolute top-0 left-0 right-0 px-4" 
        : "sticky top-0 -mx-4 md:-mx-6 px-4 md:px-6 mb-6"
    }`}>
      <div className="relative h-12 w-full">
        {/* INITIAL MODE */}
        <div className={`absolute inset-0 w-full flex items-center justify-between gap-3 transition-all duration-300 ease-out ${
          isSearching ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}>
          {/* Profile Button */}
          <button
            onClick={() => setActiveTab("settings")}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg text-[#FEF0D5] hover:text-white flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border border-white/10 text-xs font-black text-white">
              {user?.phone?.substring(1, 3) || "U"}
            </div>
          </button>

          {/* Branding Capsule */}
          <div className="flex-grow glass-panel rounded-full px-5 h-12 flex items-center justify-center gap-3 relative">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="TeleCloud" className="w-6 h-6 object-contain flex-shrink-0" />
              <span className="text-sm font-extrabold text-[#FEF0D5] tracking-wide">TeleCloud</span>
            </div>
            
            {isOffline && (
              <div className="absolute right-4 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                Offline
              </div>
            )}
          </div>

          {/* Search + Menu Options */}
          <div className="glass-panel rounded-full h-12 px-2 flex items-center gap-1 shadow-lg flex-shrink-0">
            <button
              onClick={() => setIsSearching(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-90 transition-all text-[#FEF0D5]"
              title="Search"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <div className="w-[1px] h-5 bg-white/10"></div>

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

        {/* SEARCH MODE */}
        <div className={`absolute inset-0 w-full flex items-center justify-between gap-2.5 transition-all duration-300 ease-out ${
          isSearching ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}>
          {/* Category Dropdown */}
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
            
            {showCategoryDropdown && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl glass-panel-heavy p-1.5 shadow-2xl z-50 flex flex-col gap-1 border border-white/10 bg-stone-900">
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

          {/* Search Input Bar */}
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

          {/* Close Search Button */}
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
  );
};

export default Navbar;
