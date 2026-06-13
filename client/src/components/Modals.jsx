import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";

// 1. CREATE FOLDER MODAL
export const CreateFolderModal = ({ isOpen, onClose, onCreateCategoryClick }) => {
  const { categories, createFolder, showToast } = useApp();
  const [folderName, setFolderName] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast("Folder name is required", "error");
      return;
    }

    setIsSubmitting(true);
    const result = await createFolder(folderName.trim(), category);
    setIsSubmitting(false);
    if (result && result.success) {
      setFolderName("");
      setCategory("General");
      onClose();
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "CREATE_NEW_CAT") {
      // Toggle create category modal
      onCreateCategoryClick();
    } else {
      setCategory(value);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 scale-in">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Create Folder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Folder Name</label>
            <input
              type="text"
              placeholder="e.g. Travel Photos"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold cursor-pointer appearance-none bg-stone-900"
              disabled={isSubmitting}
            >
              <option value="General">General</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="CREATE_NEW_CAT" className="text-blue-400 font-bold">
                + Create Category
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/10 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-[#C1121F]/10 active:scale-98 transition-all duration-200 cursor-pointer flex justify-center items-center mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Create Folder"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// 2. CREATE CATEGORY MODAL
export const CreateCategoryModal = ({ isOpen, onClose }) => {
  const { createCategory, showToast } = useApp();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    setIsSubmitting(true);
    const result = await createCategory(name.trim());
    setIsSubmitting(false);
    if (result && result.success) {
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 scale-in">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Create Category</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Work, Study"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/10 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-[#C1121F]/10 active:scale-98 transition-all duration-200 cursor-pointer flex justify-center items-center mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Add Category"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. ADD MEMBER / COLLABORATOR MODAL (Supports username/phone)
export const AddMemberModal = ({ isOpen, onClose, folder }) => {
  const { showToast, fetchFolders } = useApp();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !folder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      showToast("Phone number or username is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.folders.addMember(folder._id, phone.trim());
      if (data.success) {
        showToast("Collaborator invited and added to Telegram channel!");
        fetchFolders();
        setPhone("");
        onClose();
      }
    } catch (err) {
      showToast(err.message || "Failed to add collaborator", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 scale-in">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-white">Share Folder</h3>
            <p className="text-[10px] text-gray-400 font-medium">Add TeleCloud member via username or phone</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">User's Username or Phone</label>
            <input
              type="text"
              placeholder="e.g. @username or +1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold text-center tracking-wider placeholder:text-gray-500 font-medium"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/10 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-[#C1121F]/10 active:scale-98 transition-all duration-200 cursor-pointer flex justify-center items-center mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Add to Channel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// 4. EDIT FOLDER MODAL
export const EditFolderModal = ({ isOpen, onClose, folder }) => {
  const { categories, fetchFolders, showToast } = useApp();

  const getFolderName = (title) => {
    if (!title) return "";
    return title.split("::")[0];
  };

  const getFolderCategory = (title) => {
    if (!title) return "General";
    return title.split("::")[1] || "General";
  };

  const [folderName, setFolderName] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (folder) {
      setFolderName(getFolderName(folder.title));
      setCategory(folder.category || getFolderCategory(folder.title));
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast("Folder name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.folders.update(folder._id, folderName.trim(), category);
      if (result.success) {
        showToast("Folder settings updated successfully!");
        fetchFolders();
        onClose();
      }
    } catch (err) {
      showToast(err.message || "Failed to update folder", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 scale-in">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Edit Folder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold cursor-pointer appearance-none bg-stone-900"
              disabled={isSubmitting}
            >
              <option value="General">General</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-[#C1121F] to-[#780001] border border-white/10 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-[#C1121F]/10 active:scale-98 transition-all duration-200 cursor-pointer flex justify-center items-center mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
