import Category from "../models/Category.js";

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    // Check if duplicate exists for this owner (case-insensitive)
    const existingCategory = await Category.findOne({
      owner: req.user._id,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      name: trimmedName,
      owner: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET CATEGORIES
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ owner: req.user._id }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
