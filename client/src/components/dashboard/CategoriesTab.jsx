import React from "react";
import { useApp } from "../../context/AppContext";

const CategoriesTab = ({
  isSidebar,
  onCreateCategoryClick
}) => {
  const { categories } = useApp();

  return (
    <div className={`flex flex-col gap-6 flex-grow w-full ${isSidebar ? "overflow-y-auto pr-1 h-full px-4" : "max-w-md mx-auto"}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Categories</h2>
        <button
          onClick={onCreateCategoryClick}
          className="px-3.5 py-2 rounded-xl bg-[#C1121F]/10 hover:bg-[#C1121F]/20 border border-[#C1121F]/20 hover:border-[#C1121F]/30 text-[#FEF0D5] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
        >
          + Add New
        </button>
      </div>

      <div className="flex flex-col gap-2 animate-fade-in">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="glass-card rounded-2xl p-4 flex justify-between items-center border border-white/5"
          >
            <span className="text-sm font-semibold text-gray-200">{cat.name}</span>
            <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-gray-500 font-bold uppercase tracking-wide">
              Category
            </span>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No user-defined categories yet.</p>
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;
