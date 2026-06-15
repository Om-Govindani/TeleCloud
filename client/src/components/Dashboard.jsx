import React, { useState, useRef, useEffect } from "react";
import Navbar from "./dashboard/Navbar";
import FoldersTab from "./dashboard/FoldersTab";
import CategoriesTab from "./dashboard/CategoriesTab";
import SettingsTab from "./dashboard/SettingsTab";
import BottomBar from "./dashboard/BottomBar";
import ProgressBar from "./dashboard/ProgressBar";

const Dashboard = ({ 
  onCreateFolderClick, 
  onCreateCategoryClick, 
  isSidebar = false, 
  onFolderSelect,
  desktopRightView,
  setDesktopRightView 
}) => {
  const [activeTab, setActiveTab] = useState("my-folders"); // "my-folders" | "shared-with-me" | "categories" | "settings"
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  
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

      {/* TOP CAPSULE NAV BAR */}
      <Navbar
        isSidebar={isSidebar}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        showCategoryDropdown={showCategoryDropdown}
        setShowCategoryDropdown={setShowCategoryDropdown}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        dropdownRef={dropdownRef}
        setActiveTab={setActiveTab}
      />

      {/* DASHBOARD CONTENT PANEL */}
      {(activeTab === "my-folders" || activeTab === "shared-with-me") && (
        <FoldersTab
          isSidebar={isSidebar}
          activeTab={activeTab}
          selectedCategoryFilter={selectedCategoryFilter}
          onFolderSelect={onFolderSelect}
        />
      )}

      {activeTab === "categories" && (
        <CategoriesTab
          isSidebar={isSidebar}
          onCreateCategoryClick={onCreateCategoryClick}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          isSidebar={isSidebar}
          desktopRightView={desktopRightView}
          setDesktopRightView={setDesktopRightView}
        />
      )}

      {/* BACKGROUND PROGRESS CONTROLLER */}
      <ProgressBar isSidebar={isSidebar} />

      {/* FLOATING GLASS BOTTOM NAVIGATION TAB-BAR */}
      <BottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateFolderClick={onCreateFolderClick}
        isSidebar={isSidebar}
      />
    </div>
  );
};

export default Dashboard;
