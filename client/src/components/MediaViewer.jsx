import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { getFullImage, saveFullImage } from "../services/indexedDB";

const MediaViewer = ({ file, files, onClose }) => {
  const [currentFile, setCurrentFile] = useState(file);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const videoRef = useRef(null);

  const currentIndex = files.findIndex((f) => f._id === currentFile._id);

  const [imageUrl, setImageUrl] = useState("");

  // Reset zoom on file change
  useEffect(() => {
    setZoomLevel(1);
    setIsImageLoading(true);
  }, [currentFile]);

  const isImage = currentFile.mimeType?.startsWith("image/");

  useEffect(() => {
    let active = true;
    let localUrl = "";

    const loadImage = async () => {
      if (!isImage || !currentFile) return;
      setIsImageLoading(true);

      try {
        // 1. Try to get the image from IndexedDB
        const cached = await getFullImage(currentFile._id);
        if (cached && active) {
          console.log(`Loading image ${currentFile._id} from IndexedDB cache`);
          localUrl = URL.createObjectURL(cached.blob);
          setImageUrl(localUrl);
          setIsImageLoading(false);
          return;
        }

        // 2. Fetch from network
        console.log(`Fetching image ${currentFile._id} from network`);
        const url = api.files.downloadUrl(currentFile._id);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        
        const blob = await response.blob();
        if (active) {
          localUrl = URL.createObjectURL(blob);
          setImageUrl(localUrl);
          setIsImageLoading(false);
        }

        // Save to IndexedDB in background
        await saveFullImage(currentFile._id, blob, currentFile.mimeType || "image/jpeg");
      } catch (err) {
        console.error("Error loading full image:", err);
        if (active) {
          // Fallback directly to backend download URL if something fails
          setImageUrl(api.files.downloadUrl(currentFile._id));
          setIsImageLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [currentFile, isImage]);

  if (!currentFile) return null;

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentFile(files[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentFile(files[currentIndex - 1]);
    }
  };

  const handleDoubleTap = () => {
    setZoomLevel((prev) => (prev === 1 ? 2 : 1));
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = api.files.downloadUrl(currentFile._id);
    a.download = currentFile.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentFile.fileName,
          text: `Check out ${currentFile.fileName} on TeleCloud`,
          url: window.location.origin + api.files.downloadUrl(currentFile._id),
        });
      } catch (err) {
        console.log("Sharing failed", err);
      }
    } else {
      // Fallback copy url
      const url = window.location.origin + api.files.downloadUrl(currentFile._id);
      navigator.clipboard.writeText(url);
      alert("Download URL copied to clipboard!");
    }
  };

  const isVideo = currentFile.mimeType?.startsWith("video/");
  const isPdf = currentFile.fileName?.endsWith(".pdf");
  const isZip =
    currentFile.fileName?.endsWith(".zip") ||
    currentFile.fileName?.endsWith(".rar") ||
    currentFile.fileName?.endsWith(".7z");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden select-none select-none">
      {/* Top Glass Control Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-50">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer active:scale-90 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center overflow-hidden max-w-[200px]">
          <p className="text-xs font-bold text-white truncate">{currentFile.fileName}</p>
          <p className="text-[9px] text-gray-400 font-medium">
            {currentIndex + 1} of {files.length}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer active:scale-90 transition-transform"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer active:scale-90 transition-transform"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center media viewer */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {/* IMAGE RENDERER WITH DOUBLE TAP ZOOM */}
        {isImage && (
          <div className="relative max-w-full max-h-[80vh] flex items-center justify-center select-none">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={imageUrl || api.files.downloadUrl(currentFile._id)}
              alt={currentFile.fileName}
              onDoubleClick={handleDoubleTap}
              onLoad={() => setIsImageLoading(false)}
              className="max-w-full max-h-[80vh] object-contain rounded-lg transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in",
              }}
            />
          </div>
        )}

        {/* ON-DEMAND VIDEO STREAMING PLAYER */}
        {isVideo && (
          <div className="w-full max-w-2xl max-h-[80vh] aspect-video rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
            <video
              ref={videoRef}
              src={api.files.downloadUrl(currentFile._id)}
              controls
              autoPlay
              className="w-full h-full object-contain"
              preload="none" // do not preload videos
            />
          </div>
        )}

        {/* NON-MEDIA FILE PREVIEW CARD */}
        {!isImage && !isVideo && (
          <div className="glass-panel w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-6 text-center">
            <div className={`p-4 rounded-full border-2 ${
              isPdf
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : isZip
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}>
              {isPdf ? (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ) : isZip ? (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 11v1m0-6V9m0-5h.01M12 12h.01M12 15h.01M12 18h.01M12 21h.01" />
                </svg>
              ) : (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white break-all max-w-[240px]">{currentFile.fileName}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {isPdf ? "PDF Document" : isZip ? "Archive File" : "Binary Document"}
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-xs active:scale-95 transition-transform cursor-pointer"
            >
              Download Original file
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Nav Arrows (Desktop Overlay) */}
      <div className="hidden md:flex absolute inset-y-0 left-0 items-center justify-center p-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-90 transition-transform cursor-pointer disabled:opacity-30"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="hidden md:flex absolute inset-y-0 right-0 items-center justify-center p-4">
        <button
          onClick={handleNext}
          disabled={currentIndex === files.length - 1}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-90 transition-transform cursor-pointer disabled:opacity-30"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Swipe/Keyboard listener indicator for mobile */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-gray-500 font-medium">
        {isImage && "Double-tap to Zoom"}
      </div>
    </div>
  );
};

export default MediaViewer;
