import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot create duplicate category names (case-insensitive checks can be handled in controller)
categorySchema.index({ owner: 1, name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
