import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [folders, setFolders] = useState({ myFolders: [], sharedWithMe: [] });
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeFiles, setActiveFiles] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [storageStats, setStorageStats] = useState({ totalSize: 0, totalFiles: 0, totalFolders: 0 });
  
  // Floating status bar state (Taylor Swift Music Player style indicator)
  const [progressState, setProgressState] = useState({
    show: false,
    fileName: "",
    progress: 0,
    type: "upload", // "upload" | "download"
  });

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const fetchStorageStats = async () => {
    try {
      const data = await api.files.getStorageStats();
      if (data.success) {
        setStorageStats({
          totalSize: data.totalSize,
          totalFiles: data.totalFiles,
          totalFolders: data.totalFolders,
        });
      }
    } catch (err) {
      console.error("Fetch storage stats failed:", err);
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Back online!", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast("Network connection lost. Offline mode active.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check login session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedUser = localStorage.getItem("telecloud_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          // Trigger data pre-fetch
          fetchFolders();
          fetchCategories();
          fetchStorageStats();
        }
      } catch (err) {
        console.error("Session restore failed:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initSession();
  }, []);

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem("telecloud_user", JSON.stringify(userData));
    fetchFolders();
    fetchCategories();
    fetchStorageStats();
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("telecloud_user");
    setFolders({ myFolders: [], sharedWithMe: [] });
    setCategories([]);
    setActiveFolder(null);
    setActiveFiles([]);
    showToast("Logged out successfully");
  };

  const fetchFolders = async () => {
    try {
      const data = await api.folders.list();
      if (data.success) {
        setFolders({
          myFolders: data.myFolders || [],
          sharedWithMe: data.sharedWithMe || [],
        });
      }
    } catch (err) {
      console.error("Fetch folders failed:", err);
      if (err.message.includes("Unauthorized")) {
        logoutUser();
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.categories.list();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Fetch categories failed:", err);
    }
  };

  const createFolder = async (folderName, category) => {
    try {
      const data = await api.folders.create(folderName, category);
      if (data.success) {
        showToast("Folder created successfully!");
        fetchFolders();
        fetchStorageStats();
        return { success: true, folder: data.folder };
      }
    } catch (err) {
      showToast(err.message || "Failed to create folder", "error");
      return { success: false, error: err.message };
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      const data = await api.folders.delete(folderId);
      if (data.success) {
        showToast("Folder deleted successfully!");
        fetchFolders();
        fetchStorageStats();
        if (activeFolder && activeFolder._id === folderId) {
          setActiveFolder(null);
          setActiveFiles([]);
        }
        return true;
      }
    } catch (err) {
      showToast(err.message || "Failed to delete folder", "error");
      return false;
    }
  };

  const createCategory = async (name) => {
    try {
      const data = await api.categories.create(name);
      if (data.success) {
        showToast(`Category "${name}" created!`);
        fetchCategories();
        return { success: true, category: data.category };
      }
    } catch (err) {
      showToast(err.message || "Failed to create category", "error");
      return { success: false, error: err.message };
    }
  };

  const cacheThumbnailsForFiles = async (files, cachedFiles = []) => {
    const cacheMap = new Map(cachedFiles.map(f => [f._id, f.thumbnailDataUrl]));
    let hasNewCache = false;

    const promises = files.map(async (file) => {
      const isMedia = file.mimeType?.startsWith("image/") || file.mimeType?.startsWith("video/");
      let thumbnailDataUrl = cacheMap.get(file._id);

      if (isMedia && !thumbnailDataUrl) {
        try {
          const response = await fetch(api.files.thumbnailUrl(file._id));
          if (response.ok) {
            const blob = await response.blob();
            thumbnailDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
            if (thumbnailDataUrl) {
              hasNewCache = true;
            }
          }
        } catch (e) {
          console.error(`Failed to fetch thumbnail base64 for ${file._id}:`, e);
        }
      }

      return {
        ...file,
        thumbnailDataUrl: thumbnailDataUrl || null
      };
    });

    const updatedFiles = await Promise.all(promises);
    return { updatedFiles, hasNewCache };
  };

  const fetchActiveFilesAndCacheSilently = async (folderId, cacheKey, lastFileId, cachedFiles = []) => {
    try {
      const data = await api.files.list(folderId);
      if (data.success) {
        const freshFiles = data.files || [];
        
        // Cache thumbnails for fresh files in background
        const { updatedFiles, hasNewCache } = await cacheThumbnailsForFiles(freshFiles, cachedFiles);
        
        // Update state and localStorage if list length changed, new file uploaded/deleted, or new thumbnails cached
        const isListChanged = 
          cachedFiles.length !== updatedFiles.length || 
          (updatedFiles[0] && cachedFiles[0] && updatedFiles[0]._id !== cachedFiles[0]._id) ||
          hasNewCache;

        if (isListChanged || !cachedFiles.length) {
          console.log(`Cache updated for folder ${folderId}`);
          setActiveFiles(updatedFiles);
          const cacheEntry = {
            lastFileId,
            files: updatedFiles,
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        }
      }
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  };

  const selectFolder = async (folder) => {
    setActiveFolder(folder);
    if (!folder) {
      setActiveFiles([]);
      return;
    }

    const cacheKey = `telecloud_cache_files_${folder._id}`;
    let cachedData = null;
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        cachedData = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse cached files:", e);
    }

    const currentLastFileId = folder.lastFile ? folder.lastFile._id : null;

    if (cachedData && cachedData.files && cachedData.files.length > 0) {
      // Set active files instantly from cache!
      setActiveFiles(cachedData.files);
      setIsFolderLoading(false);
      
      // Quietly fetch updates and new thumbnails in background
      fetchActiveFilesAndCacheSilently(folder._id, cacheKey, currentLastFileId, cachedData.files);
      return;
    }

    // Cache missing: show loading spinner and fetch from network
    setIsFolderLoading(true);
    try {
      const data = await api.files.list(folder._id);
      if (data.success) {
        const freshFiles = data.files || [];
        
        // Show files list immediately (no spinner block on thumbnails)
        setActiveFiles(freshFiles);
        setIsFolderLoading(false);

        // Fetch thumbnails quietly in background
        fetchActiveFilesAndCacheSilently(folder._id, cacheKey, currentLastFileId, []);
      }
    } catch (err) {
      showToast("Failed to fetch folder files", "error");
      console.error(err);
      setIsFolderLoading(false);
    }
  };

  const refreshActiveFolderFiles = async () => {
    if (!activeFolder) return;
    try {
      const data = await api.files.list(activeFolder._id);
      if (data.success) {
        const freshFiles = data.files || [];
        
        // Update cache on manual/active refresh
        const cacheKey = `telecloud_cache_files_${activeFolder._id}`;
        let cachedFiles = [];
        try {
          const stored = localStorage.getItem(cacheKey);
          if (stored) {
            cachedFiles = JSON.parse(stored).files || [];
          }
        } catch (e) {}

        // Set immediate files list
        setActiveFiles(freshFiles);

        // Update thumbnails in background and write to localStorage
        const { updatedFiles } = await cacheThumbnailsForFiles(freshFiles, cachedFiles);
        setActiveFiles(updatedFiles);

        const currentLastFileId = updatedFiles[0] ? updatedFiles[0]._id : null;
        const cacheEntry = {
          lastFileId: currentLastFileId,
          files: updatedFiles,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

        // Trigger updating the sidebar/folders list metadata
        fetchFolders();
        fetchStorageStats();
      }
    } catch (err) {
      console.error("Refresh files failed:", err);
    }
  };

  const uploadFile = async (file, onProgress) => {
    if (!activeFolder) return;
    setProgressState({
      show: true,
      fileName: file.name,
      progress: 0,
      type: "upload",
    });

    try {
      const data = await api.files.upload(
        activeFolder._id,
        file,
        (progress) => {
          setProgressState((prev) => ({ ...prev, progress }));
          if (onProgress) onProgress(progress);
        }
      );

      if (data.success) {
        showToast(`Uploaded ${file.name} successfully!`);
        await refreshActiveFolderFiles();
        fetchStorageStats();
      }
    } catch (err) {
      showToast(err.message || `Failed to upload ${file.name}`, "error");
      throw err; // Re-throw so caller can flag error state
    } finally {
      // Small timeout to show 100% completion state
      setTimeout(() => {
        setProgressState({ show: false, fileName: "", progress: 0, type: "upload" });
      }, 1000);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthLoading,
        folders,
        categories,
        searchQuery,
        setSearchQuery,
        activeFolder,
        activeFiles,
        isFolderLoading,
        isOffline,
        progressState,
        setProgressState,
        toast,
        showToast,
        loginUser,
        logoutUser,
        fetchFolders,
        createFolder,
        deleteFolder,
        createCategory,
        selectFolder,
        refreshActiveFolderFiles,
        uploadFile,
        storageStats,
        fetchStorageStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
