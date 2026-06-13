import express from "express";
import {
  createFolder,
  getFolders,
  deleteFolder,
  addMember,
  removeMember,
  updateFolder,
} from "../controllers/folder.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-folder", protect, createFolder);
router.get("/", protect, getFolders);
router.put("/:folderId", protect, updateFolder);
router.delete("/:folderId", protect, deleteFolder);
router.post("/:folderId/members", protect, addMember);
router.delete("/:folderId/members/:memberId", protect, removeMember);

export default router;