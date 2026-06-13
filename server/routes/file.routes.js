import express from "express";
import multer from "multer";
import {
  uploadFile,
  listFiles,
  downloadFile,
  getFileThumbnail,
  deleteFile,
} from "../controllers/file.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Multer configuration for temporary file storage
const upload = multer({ dest: "temp/" });

router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/folder/:folderId", protect, listFiles);
router.get("/:fileId/download", protect, downloadFile);
router.get("/:fileId/thumbnail", protect, getFileThumbnail);
router.delete("/:fileId", protect, deleteFile);

export default router;
