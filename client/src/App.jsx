import React, { useState } from "react";
import { useApp } from "./context/AppContext";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import FolderView from "./components/FolderView";
import MediaViewer from "./components/MediaViewer";
import {
  CreateFolderModal,
  CreateCategoryModal,
  AddMemberModal,
  EditFolderModal,
} from "./components/Modals";

function App() {
  const {
    user,
    isAuthLoading,
    activeFolder,
    activeFiles,
    selectFolder,
    toast,
    folders,
    logoutUser,
  } = useApp();

  const [currentScreen, setCurrentScreen] = useState("welcome"); // "welcome" | "login"
  const [desktopRightView, setDesktopRightView] = useState("folder"); // "folder" | "settings" | "devices"

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isShareFolderOpen, setIsShareFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);

  // Active viewing media
  const [activeMedia, setActiveMedia] = useState(null);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-[#08090c] text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20 text-white animate-bounce shadow-lg shadow-blue-500/10">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Initializing TeleCloud...</p>
          <p className="text-[10px] text-gray-500 font-medium">Securing MTProto cloud buckets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-active min-h-screen text-gray-100 relative">
      {/* Toast Alert overlay */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-fade-in-down pointer-events-none">
          <div className={`glass-panel-heavy rounded-2xl px-4 py-3.5 flex items-center gap-3 border shadow-2xl ${
            toast.type === "error"
              ? "border-red-500/30 text-red-300"
              : "border-blue-500/30 text-blue-300"
          }`}>
            {toast.type === "error" ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-xs font-bold leading-normal">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {!user ? (
        currentScreen === "welcome" ? (
          <WelcomeScreen onGetStarted={() => setCurrentScreen("login")} />
        ) : (
          <LoginScreen />
        )
      ) : (
        /* Logged In Workspace */
        <div className="flex h-screen w-full overflow-hidden relative">
          {/* Background Liquid Bubbles */}
          <div className="bg-liquid-glow">
            <div className="bg-bubble bg-bubble-1"></div>
            <div className="bg-bubble bg-bubble-2"></div>
            <div className="bg-bubble bg-bubble-3"></div>
          </div>
          
          {/* DESKTOP SPLIT VIEW: Left Sidebar (Visible only on md screens and up) */}
          <aside className="hidden md:flex flex-col w-[380px] lg:w-[420px] h-full border-r border-white/5 bg-transparent backdrop-blur-2xl flex-shrink-0 select-none z-10 relative">
            <Dashboard
              onCreateFolderClick={() => setIsCreateFolderOpen(true)}
              onCreateCategoryClick={() => setIsCreateCategoryOpen(true)}
              onAddMemberClick={() => setIsShareFolderOpen(true)}
              isSidebar={true}
              onFolderSelect={() => setDesktopRightView("folder")}
              desktopRightView={desktopRightView}
              setDesktopRightView={setDesktopRightView}
            />
          </aside>

          {/* MAIN CONTAINER (Responsive Router) */}
          <main className="flex-grow h-full overflow-hidden relative flex flex-col">
            {/* On Mobile (hidden on desktop): standard screen routing */}
            <div className="md:hidden w-full h-full">
              {activeFolder ? (
                <FolderView
                  onShareClick={() => setIsShareFolderOpen(true)}
                  onEditClick={() => setIsEditFolderOpen(true)}
                  onMediaClick={(media) => setActiveMedia(media)}
                />
              ) : (
                <Dashboard
                  onCreateFolderClick={() => setIsCreateFolderOpen(true)}
                  onCreateCategoryClick={() => setIsCreateCategoryOpen(true)}
                  onAddMemberClick={() => setIsShareFolderOpen(true)}
                />
              )}
            </div>

            {/* On Desktop (hidden on mobile): split-screen views */}
            <div className="hidden md:block w-full h-full">
              {desktopRightView === "devices" && (
                <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[#03060a]/20">
                  <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col items-center gap-6 text-center border border-white/10 shadow-2xl">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center border border-white/10 text-emerald-100 text-xl font-bold shadow-lg">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-white">Connected Telegram Clients</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active MTProto Cloud Buckets</p>
                    </div>
                    <div className="w-full divide-y divide-white/5 text-left text-xs">
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400">Current Device</span>
                        <span className="font-semibold text-white">TeleCloud Client PWA</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400">Connection Mode</span>
                        <span className="font-semibold text-emerald-400">Secure GramJS MTProto</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-gray-400">Telegram Session</span>
                        <span className="font-semibold text-white truncate max-w-[150px]">Active StringSession</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 text-[10px] font-semibold leading-relaxed">
                      This PWA communicates directly with your personal Telegram channels using a JWT-authorized session token.
                    </div>
                  </div>
                </div>
              )}

              {desktopRightView === "settings" && (
                <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[#03060a]/20">
                  <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col items-center gap-6 text-center border border-white/10 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] flex items-center justify-center border-2 border-white/20 text-xl font-bold text-white uppercase shadow-md">
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
                  </div>
                </div>
              )}

              {desktopRightView === "folder" && activeFolder && (
                <FolderView
                  onShareClick={() => setIsShareFolderOpen(true)}
                  onEditClick={() => setIsEditFolderOpen(true)}
                  onMediaClick={(media) => setActiveMedia(media)}
                />
              )}

              {desktopRightView === "folder" && !activeFolder && (
                <div className="w-full h-full flex flex-col justify-center items-center gap-4 text-center select-none bg-stone-900/10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C1121F]/10 to-[#780001]/10 border border-white/5 flex items-center justify-center text-[#C1121F]/40 shadow-lg">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-400">Select folder</p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* MODALS RENDERING */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateCategoryClick={() => {
          setIsCreateFolderOpen(false);
          setIsCreateCategoryOpen(true);
        }}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
      />

      <AddMemberModal
        isOpen={isShareFolderOpen}
        onClose={() => setIsShareFolderOpen(false)}
        folder={activeFolder}
      />

      <EditFolderModal
        isOpen={isEditFolderOpen}
        onClose={() => setIsEditFolderOpen(false)}
        folder={activeFolder}
      />

      {/* FULLSCREEN MEDIA VIEWER OVERLAY */}
      {activeMedia && (
        <MediaViewer
          file={activeMedia}
          files={activeFiles}
          onClose={() => setActiveMedia(null)}
        />
      )}
    </div>
  );
}

export default App;
