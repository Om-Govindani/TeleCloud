// API client wrappers for communicating with Express backend

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Authentication
  auth: {
    sendOTP: async (phone) => {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      return handleResponse(response);
    },
    verifyOTP: async (otp) => {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      return handleResponse(response);
    },
  },

  // Categories
  categories: {
    list: async () => {
      const response = await fetch("/api/categories");
      return handleResponse(response);
    },
    create: async (name) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      return handleResponse(response);
    },
  },

  // Folders
  folders: {
    list: async () => {
      const response = await fetch("/api/folder");
      return handleResponse(response);
    },
    create: async (folderName, category) => {
      const response = await fetch("/api/folder/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, category }),
      });
      return handleResponse(response);
    },
    delete: async (folderId) => {
      const response = await fetch(`/api/folder/${folderId}`, {
        method: "DELETE",
      });
      return handleResponse(response);
    },
    update: async (folderId, folderName, category) => {
      const response = await fetch(`/api/folder/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, category }),
      });
      return handleResponse(response);
    },
    addMember: async (folderId, phone) => {
      const response = await fetch(`/api/folder/${folderId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      return handleResponse(response);
    },
    removeMember: async (folderId, memberId) => {
      const response = await fetch(`/api/folder/${folderId}/members/${memberId}`, {
        method: "DELETE",
      });
      return handleResponse(response);
    },
  },

  // Files
  files: {
    getStorageStats: async () => {
      const response = await fetch("/api/files/storage/stats");
      return handleResponse(response);
    },
    list: async (folderId) => {
      const response = await fetch(`/api/files/folder/${folderId}`);
      return handleResponse(response);
    },
    upload: async (folderId, file, onProgress) => {
      const formData = new FormData();
      formData.append("folderId", folderId);
      formData.append("file", file);

      // Using standard XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = import.meta.env.PROD
          ? "https://telecloud-production-ab69.up.railway.app/api/files/upload"
          : "/api/files/upload";
        xhr.open("POST", url);
        xhr.withCredentials = true; // Send cookies cross-origin

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              resolve({ success: true });
            }
          } else {
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.message || "Upload failed"));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(formData);
      });
    },
    downloadUrl: (fileId) => `/api/files/${fileId}/download`,
    thumbnailUrl: (fileId) => `/api/files/${fileId}/thumbnail`,
    delete: async (fileId) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      return handleResponse(response);
    },
  },
};
