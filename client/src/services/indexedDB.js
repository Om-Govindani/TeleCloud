const DB_NAME = "telecloud_cache_db";
const DB_VERSION = 1;
const THUMBNAILS_STORE = "thumbnails";
const FULL_IMAGES_STORE = "fullImages";

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
        db.createObjectStore(THUMBNAILS_STORE, { keyPath: "fileId" });
      }
      if (!db.objectStoreNames.contains(FULL_IMAGES_STORE)) {
        db.createObjectStore(FULL_IMAGES_STORE, { keyPath: "fileId" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB open error:", event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
};

export const getThumbnail = async (fileId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(THUMBNAILS_STORE, "readonly");
      const store = transaction.objectStore(THUMBNAILS_STORE);
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result ? request.result.dataUrl : null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB getThumbnail error:", err);
    return null;
  }
};

export const saveThumbnail = async (fileId, dataUrl) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(THUMBNAILS_STORE, "readwrite");
      const store = transaction.objectStore(THUMBNAILS_STORE);
      const request = store.put({ fileId, dataUrl, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB saveThumbnail error:", err);
  }
};

export const getFullImage = async (fileId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FULL_IMAGES_STORE, "readonly");
      const store = transaction.objectStore(FULL_IMAGES_STORE);
      const request = store.get(fileId);
      request.onsuccess = () => {
        if (request.result) {
          resolve({ blob: request.result.blob, contentType: request.result.contentType });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB getFullImage error:", err);
    return null;
  }
};

export const saveFullImage = async (fileId, blob, contentType) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FULL_IMAGES_STORE, "readwrite");
      const store = transaction.objectStore(FULL_IMAGES_STORE);
      const request = store.put({
        fileId,
        blob,
        contentType,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB saveFullImage error:", err);
  }
};

export const cleanExpiredFullImages = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FULL_IMAGES_STORE, "readwrite");
      const store = transaction.objectStore(FULL_IMAGES_STORE);
      const request = store.openCursor();
      const now = Date.now();
      const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const record = cursor.value;
          if (now - record.timestamp > EXPIRY_MS) {
            console.log(`Evicting full image ${record.fileId} from IndexedDB cache (expired)`);
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`IndexedDB cleanup completed: evicted ${deletedCount} full images.`);
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB cleanup error:", err);
  }
};

export const clearAllCache = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([THUMBNAILS_STORE, FULL_IMAGES_STORE], "readwrite");
      const thumbsStore = transaction.objectStore(THUMBNAILS_STORE);
      const fullStore = transaction.objectStore(FULL_IMAGES_STORE);
      
      const clearThumbs = thumbsStore.clear();
      const clearFull = fullStore.clear();
      
      transaction.oncomplete = () => {
        console.log("IndexedDB cache cleared successfully.");
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        console.error("IndexedDB clear error:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB clearAllCache error:", err);
    return false;
  }
};
