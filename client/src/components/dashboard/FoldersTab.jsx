import React from "react";
import { useApp } from "../../context/AppContext";

const FoldersTab = ({
  isSidebar,
  activeTab,
  selectedCategoryFilter,
  onFolderSelect
}) => {
  const { folders, searchQuery, selectFolder, activeFolder } = useApp();

  const handleFolderClick = (folder) => {
    selectFolder(folder);
    if (onFolderSelect) onFolderSelect(folder);
  };

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
    <div className={`flex flex-col gap-6 flex-grow ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : ""}`}>
      {filteredFolders.length > 0 ? (
        <div className="flex flex-col gap-3 w-full pb-4 animate-fade-in">
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
                  {/* Folder Icon Bubble */}
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
        <div className="flex flex-col items-center justify-center flex-grow py-16 text-center gap-4 animate-fade-in">
          <div className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-600">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-gray-300">No folders found</p>
            <p className="text-xs text-gray-500 max-w-xs px-4">
              {searchQuery
                ? "Adjust your search filters to show matching folders."
                : "Create a new folder to start using private Telegram storage buckets."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoldersTab;
