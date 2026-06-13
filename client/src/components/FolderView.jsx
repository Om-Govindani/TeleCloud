import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const TextNoteCard = ({ file }) => {
  const [content, setContent] = useState("Loading note...");

  useEffect(() => {
    let active = true;
    fetch(api.files.downloadUrl(file._id))
      .then((r) => r.text())
      .then((text) => {
        if (active) setContent(text);
      })
      .catch((err) => {
        if (active) setContent("Failed to load note content.");
      });
    return () => {
      active = false;
    };
  }, [file._id]);

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium leading-relaxed select-text overflow-hidden whitespace-pre-wrap break-words max-h-40">
      {content}
    </div>
  );
};

const FolderView = ({ onShareClick, onEditClick, onMediaClick }) => {
  const {
    activeFolder,
    activeFiles,
    isFolderLoading,
    selectFolder,
    uploadFile,
    deleteFolder,
    showToast,
    refreshActiveFolderFiles,
  } = useApp();

  const [message, setMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
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
    return title.split("::")[1] || "General";
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newStaged = files.map((file) => ({
      id: `staged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending"
    }));
    setSelectedFiles((prev) => [...prev, ...newStaged]);
    e.target.value = null; // reset input
  };

  const handleRemoveFile = (idToRemove) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // Text message and file uploader composer
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && selectedFiles.length === 0) return;

    setIsSubmittingMessage(true);
    try {
      // 1. Upload text note if there is message
      if (message.trim()) {
        const blob = new Blob([message], { type: "text/plain" });
        const noteFile = new File([blob], `note_${Date.now()}.txt`, { type: "text/plain" });
        await uploadFile(noteFile);
        setMessage("");
      }

      // 2. Upload multiple selected files in sequence
      if (selectedFiles.length > 0) {
        for (const staged of selectedFiles) {
          if (staged.status !== "pending") continue;

          setSelectedFiles((prev) =>
            prev.map((item) =>
              item.id === staged.id ? { ...item, status: "uploading", progress: 0 } : item
            )
          );

          try {
            await uploadFile(staged.file, (progress) => {
              setSelectedFiles((prev) =>
                prev.map((item) =>
                  item.id === staged.id ? { ...item, progress } : item
                )
              );
            });

            setSelectedFiles((prev) =>
              prev.map((item) =>
                item.id === staged.id ? { ...item, status: "completed", progress: 100 } : item
              )
            );

            // Auto-clear from list after 2 seconds
            setTimeout(() => {
              setSelectedFiles((prev) => prev.filter((item) => item.id !== staged.id));
            }, 2000);
          } catch (err) {
            setSelectedFiles((prev) =>
              prev.map((item) =>
                item.id === staged.id ? { ...item, status: "error" } : item
              )
            );
          }
        }
      }
    } catch (err) {
      showToast("Failed to upload assets", "error");
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (window.confirm(`Are you sure you want to delete folder "${getFolderName(activeFolder.title)}"? This will destroy the Telegram channel and delete all files.`)) {
      const success = await deleteFolder(activeFolder._id);
      if (success) {
        selectFolder(null);
      }
    }
  };

  // Selection mode handlers
  const handleCardPressOrClick = (file) => {
    if (selectionMode) {
      toggleSelectFile(file._id);
    } else {
      onMediaClick(file);
    }
  };

  const handleLongPress = (e, fileId) => {
    e.preventDefault();
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([fileId]);
    }
  };

  const toggleSelectFile = (fileId) => {
    setSelectedIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === activeFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeFiles.map((f) => f._id));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected file(s) from Telegram?`
      )
    ) {
      setIsDeletingFiles(true);
      try {
        let deletedCount = 0;
        for (const fileId of selectedIds) {
          const res = await api.files.delete(fileId);
          if (res.success) deletedCount++;
        }
        showToast(`Successfully deleted ${deletedCount} file(s).`);
        refreshActiveFolderFiles();
        handleCancelSelection();
      } catch (err) {
        showToast("Error deleting some files", "error");
      } finally {
        setIsDeletingFiles(false);
      }
    }
  };

  const isImage = (file) => file.mimeType?.startsWith("image/");
  const isVideo = (file) => file.mimeType?.startsWith("video/");
  const isPdf = (file) => file.fileName?.endsWith(".pdf");
  const isZip = (file) =>
    file.fileName?.endsWith(".zip") ||
    file.fileName?.endsWith(".rar") ||
    file.fileName?.endsWith(".7z");
  const isTextNote = (file) =>
    file.fileName?.startsWith("note_") && file.fileName?.endsWith(".txt");

  const filteredFiles = activeFiles.filter((file) =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Background Liquid Bubbles */}
      <div className="bg-liquid-glow">
        <div className="bg-bubble bg-bubble-1"></div>
        <div className="bg-bubble bg-bubble-2"></div>
        <div className="bg-bubble bg-bubble-3"></div>
      </div>

      {/* HEADER BAR */}
      {selectionMode ? (
        /* Top bar changes during Selection Mode */
        <header className="absolute top-0 left-0 right-0 z-40 w-full bg-transparent border-none backdrop-blur-none py-3 px-4 animate-fade-in">
          <div className="max-w-5xl mx-auto w-full glass-panel rounded-full px-4 h-12 flex justify-between items-center border border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelSelection}
                className="text-gray-300 hover:text-white cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-xs font-extrabold text-white">{selectedIds.length} Selected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-xs font-black uppercase tracking-wider text-[#C1121F] hover:text-[#780001] cursor-pointer"
              >
                {selectedIds.length === activeFiles.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0 || isDeletingFiles}
                className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/30 cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingFiles ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* Normal Header */
        <header className="absolute top-0 left-0 right-0 z-40 w-full bg-transparent border-none backdrop-blur-none py-3 px-4">
          <div className="max-w-5xl mx-auto w-full relative h-12">
            {/* INITIAL MODE: Shows Left Back circle, Center Folder branding (expanded), Right Search+Menu capsule */}
            <div className={`absolute inset-0 w-full flex items-center justify-between gap-3 transition-all duration-300 ease-out ${
              isSearching ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
            }`}>
              {/* Left circular back button */}
              <button
                onClick={() => selectFolder(null)}
                className="w-12 h-12 rounded-full glass-panel flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg text-white flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              {/* Folder branding capsule - expanded to cover remaining space */}
              <div className="flex-grow glass-panel rounded-full px-5 h-12 flex items-center justify-center gap-3 overflow-hidden">
                <div className="flex items-center gap-3 max-w-full overflow-hidden">
                  <img src="/logo.png" alt="TeleCloud" className="w-6 h-6 object-contain flex-shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-white truncate max-w-[150px] md:max-w-[280px]">
                      {getFolderName(activeFolder.title)}
                    </p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                      {activeFolder.category || getFolderCategory(activeFolder.title)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Combined Search + Menu Capsule */}
              <div className="glass-panel rounded-full h-12 px-2 flex items-center gap-1 shadow-lg flex-shrink-0">
                {/* Search trigger button */}
                <button
                  onClick={() => setIsSearching(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-90 transition-all text-[#FEF0D5]"
                  title="Search Files"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Separator line */}
                <div className="w-[1px] h-5 bg-white/10"></div>

                {/* Settings/Dropdown options button */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-90 transition-all text-[#FEF0D5]"
                    title="Folder Menu"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel-heavy p-1.5 shadow-2xl flex flex-col gap-1 border border-white/10 z-50">
                      <button
                        onClick={() => {
                          onShareClick();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                      >
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Folder
                      </button>
                      <button
                        onClick={() => {
                          onEditClick();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                      >
                        <svg className="w-4 h-4 text-[#C1121F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Folder
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteFolder();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Folder
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEARCH ACTIVE: Center search, Right close */}
            <div className={`absolute inset-0 w-full flex items-center justify-between gap-2.5 transition-all duration-300 ease-out ${
              isSearching ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}>
              {/* Center Capsule Search Input */}
              <div className="flex-grow relative glass-panel rounded-full flex items-center px-4 h-12 shadow-lg">
                <svg className="w-4 h-4 text-[#FEF0D5]/50 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search files..."
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
      )}

      {/* DEDICATED PREVIEW LOADING SCREEN */}
      {isFolderLoading ? (
        <div className="flex-grow flex flex-col justify-center items-center gap-4 text-center py-20 animate-pulse">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C1121F]/10 to-[#780001]/10 border border-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#C1121F] animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Preparing Media Previews...</p>
            <p className="text-[10px] text-gray-400 font-medium">Downloading Telegram thumbnails...</p>
          </div>
        </div>
      ) : (
        /* Pinterest-style Gallery Grid (Only thumbnails for photos/videos, no title/size metadata strips) */
        <div className="flex-grow overflow-y-auto w-full pt-20 pb-28 px-4 max-w-5xl mx-auto">
          {filteredFiles.length > 0 ? (
            <div className="masonry-grid animate-fade-in">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.includes(file._id);
                const isPhotoOrVideo = isImage(file) || isVideo(file);
                return (
                  <div
                    key={file._id}
                    onClick={() => handleCardPressOrClick(file)}
                    onContextMenu={(e) => handleLongPress(e, file._id)}
                    className={`masonry-item glass-card rounded-2xl overflow-hidden cursor-pointer relative group flex flex-col border transition-all duration-300 ${
                      isSelected
                        ? "border-[#C1121F] shadow-md shadow-[#C1121F]/20 scale-95"
                        : "border-white/5"
                    }`}
                  >
                    {/* Checkbox for Selection Mode */}
                    {selectionMode && (
                      <div className="absolute top-3 left-3 z-30">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#C1121F] border-[#C1121F] text-white"
                              : "border-white/20 bg-black/40"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Media renderers */}
                    {isImage(file) && (
                      <div className="relative overflow-hidden w-full">
                        <img
                          src={file.thumbnailDataUrl || api.files.thumbnailUrl(file._id)}
                          alt={file.fileName}
                          loading="lazy"
                          className="w-full object-cover max-h-72 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {isVideo(file) && (
                      <div className="relative overflow-hidden w-full bg-stone-950 aspect-video flex items-center justify-center">
                        <img
                          src={file.thumbnailDataUrl || api.files.thumbnailUrl(file._id)}
                          alt={file.fileName}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Play overlay button */}
                        <div className="absolute p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {isTextNote(file) ? (
                      <TextNoteCard file={file} />
                    ) : (
                      /* Document Card style for PDF/ZIP/General */
                      !isImage(file) && !isVideo(file) && (
                        <div className="p-4 flex items-center gap-3 w-full bg-white/2">
                          <div className={`p-3 rounded-xl flex items-center justify-center border ${
                            isPdf(file)
                              ? "bg-red-500/10 border-red-500/20 text-red-400"
                              : isZip(file)
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          }`}>
                            {isPdf(file) ? (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : isZip(file) ? (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 11v1m0-6V9m0-5h.01M12 12h.01M12 15h.01M12 18h.01M12 21h.01" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="text-left overflow-hidden flex-grow space-y-0.5">
                            <p className="text-xs font-bold text-white truncate w-full">{file.fileName}</p>
                            <span className="text-[10px] text-gray-400 uppercase font-extrabold bg-white/5 px-2 py-0.5 rounded-md">
                              {isPdf(file) ? "PDF" : isZip(file) ? "Archive" : "File"}
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Metadata strip (ONLY for non-photo and non-video files, and excluding text notes) */}
                    {!isPhotoOrVideo && !isTextNote(file) && (
                      <div className="px-3.5 py-2.5 bg-black/20 flex justify-between items-center border-t border-white/5 text-[10px] text-gray-400">
                        <span className="truncate max-w-[120px] font-medium">{file.fileName}</span>
                        <span className="font-extrabold">{formatBytes(file.size)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE ILLUSTRATION */
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4 py-16">
              <div className="w-20 h-20 rounded-full bg-white/2 border border-white/5 flex items-center justify-center text-gray-500">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-300">
                  {searchQuery ? "No matching files" : "No files yet"}
                </p>
                <p className="text-xs text-gray-500 max-w-xs px-4">
                  {searchQuery
                    ? "Try adjusting your search query to find matching items."
                    : "Upload photos, videos, archives, documents, or send a text message to get started."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM COMPOSER (Floating Chat-like Composer Area) */}
      <footer className="w-full pb-6 pt-2 bg-transparent z-30 flex-shrink-0 animate-fade-in">
        <form onSubmit={handleSendMessage} className="w-full max-w-5xl mx-auto flex items-end gap-3 px-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />

          {/* Paperclip upload button */}
          <button
            type="button"
            onClick={handleFileUploadClick}
            disabled={isSubmittingMessage}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center cursor-pointer hover:bg-white/10 text-gray-300 hover:text-white active:scale-90 transition-transform disabled:opacity-40 flex-shrink-0 border border-white/5 shadow-lg"
            title="Upload Files"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Message box container (expands in height to show previews) */}
          <div className="flex-grow flex flex-col gap-2 rounded-3xl glass-panel p-3 border border-white/10 transition-all duration-300">
            {/* Selected files preview list */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5 max-h-28 overflow-y-auto">
                {selectedFiles.map((staged) => {
                  let statusColor = "bg-white/5 border-white/10 text-gray-300";

                  if (staged.status === "uploading") {
                    statusColor = "bg-blue-500/10 border-blue-500/30 text-blue-300";
                  } else if (staged.status === "completed") {
                    statusColor = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                  } else if (staged.status === "error") {
                    statusColor = "bg-rose-500/10 border-rose-500/30 text-rose-300";
                  }

                  return (
                    <div
                      key={staged.id}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold transition-all duration-300 ${statusColor}`}
                    >
                      <span className="truncate max-w-[120px]">{staged.name}</span>
                      <span className="text-[8px] opacity-60 font-medium">({formatBytes(staged.size)})</span>
                      
                      {staged.status === "uploading" && (
                        <span className="text-[9px] font-black text-blue-400 animate-pulse ml-0.5">
                          {Math.round(staged.progress)}%
                        </span>
                      )}
                      {staged.status === "completed" && (
                        <svg className="w-3.5 h-3.5 text-emerald-400 ml-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {staged.status === "error" && (
                        <svg className="w-3.5 h-3.5 text-rose-400 ml-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}

                      {(staged.status === "pending" || staged.status === "error") && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(staged.id)}
                          className="text-gray-400 hover:text-red-400 cursor-pointer p-0.5 ml-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input field */}
            <input
              type="text"
              placeholder={selectedFiles.length > 0 ? "Add a caption..." : "Send text message or upload files..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmittingMessage}
              className="w-full bg-transparent border-none text-xs font-semibold text-[#FEF0D5] placeholder-[#FEF0D5]/35 outline-none focus:outline-none py-1 px-1"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!message.trim() && selectedFiles.length === 0) || isSubmittingMessage}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/10 text-white cursor-pointer active:scale-90 transition-transform disabled:opacity-40 disabled:scale-100 flex-shrink-0 flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 fill-white transform translate-x-[1px]" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default FolderView;
