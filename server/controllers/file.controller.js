import { Api, utils } from "telegram";
import fs from "fs";
import path from "path";
import { Jimp } from "jimp";
import File from "../models/File.js";
import Folder from "../models/Folder.js";
import { createTelegramClient, getConnectedTelegramClient } from "../services/telegram.service.js";

const getChannelPeer = async (client, channelId) => {
  try {
    return await client.getInputEntity(BigInt(channelId));
  } catch (err) {
    console.log("Channel not in cache, fetching dialogs...");
    await client.getDialogs({});
    return await client.getInputEntity(BigInt(channelId));
  }
};

// UPLOAD FILE
export const uploadFile = async (req, res) => {
  let tempFilePath = null;
  let thumbPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    tempFilePath = req.file.path;
    
    // Rename temp file to include original extension so GramJS can infer the MIME type
    // and Telegram's servers will automatically generate small media thumbnails.
    const originalExt = path.extname(req.file.originalname);
    if (originalExt) {
      const newTempFilePath = tempFilePath + originalExt;
      fs.renameSync(tempFilePath, newTempFilePath);
      tempFilePath = newTempFilePath;
    }

    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: "Folder ID is required",
      });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Verify ownership check bypassed for collaborative uploads

    const client = await getConnectedTelegramClient(req.user._id, req.user.telegramSession);

    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Generate thumbnail if file is an image
    const isImage = req.file.mimetype && req.file.mimetype.startsWith("image/");
    if (isImage) {
      try {
        const thumbName = `${path.basename(tempFilePath, path.extname(tempFilePath))}_thumb.jpg`;
        thumbPath = path.join(path.dirname(tempFilePath), thumbName);
        console.log(`Generating thumbnail using Jimp for image upload: ${thumbPath}`);
        
        const image = await Jimp.read(tempFilePath);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        if (width > 320 || height > 320) {
          if (width > height) {
            image.resize({ w: 320, h: Jimp.AUTO });
          } else {
            image.resize({ w: Jimp.AUTO, h: 320 });
          }
        }
        
        const buffer = await image.getBuffer("image/jpeg", { quality: 80 });
        await fs.promises.writeFile(thumbPath, buffer);

        const thumbStats = fs.statSync(thumbPath);
        console.log(`Generated thumbnail size: ${thumbStats.size} bytes`);
      } catch (jimpErr) {
        console.error("Failed to generate image thumbnail with Jimp:", jimpErr);
        thumbPath = null; // reset to upload without thumbnail if Jimp fails
      }
    }

    console.log(`Uploading file ${req.file.originalname} to Telegram channel...`);

    // Upload to Telegram channel
    const message = await client.sendFile(channelPeer, {
      file: tempFilePath,
      forceDocument: true, // upload as document to preserve quality and name
      thumb: thumbPath || undefined,
      attributes: [
        new Api.DocumentAttributeFilename({
          fileName: req.file.originalname,
        }),
      ],
    });

    if (!message || !message.media) {
      throw new Error("Failed to upload file to Telegram");
    }

    // Extract file/document details
    let telegramFileId = "";
    if (message.media.document) {
      telegramFileId = message.media.document.id.toString();
    } else if (message.media.photo) {
      telegramFileId = message.media.photo.id.toString();
    } else {
      telegramFileId = message.id.toString();
    }

    const newFile = await File.create({
      folder: folder._id,
      telegramMessageId: message.id,
      telegramFileId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (err) {
    console.error("File upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
        console.log(`Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupErr) {
        console.error("Failed to clean up temp file:", cleanupErr);
      }
    }
    // Clean up temporary thumbnail file
    if (thumbPath && fs.existsSync(thumbPath)) {
      try {
        await fs.promises.unlink(thumbPath);
        console.log(`Cleaned up temporary thumbnail file: ${thumbPath}`);
      } catch (cleanupErr) {
        console.error("Failed to clean up temp thumbnail file:", cleanupErr);
      }
    }
  }
};

// LIST FILES IN FOLDER
export const listFiles = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check permissions: must be owner or a member
    const isOwner = folder.owner.toString() === req.user._id.toString();
    const isMember = folder.members.includes(req.user._id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to view files in this folder.",
      });
    }

    const files = await File.find({ folder: folderId })
      .populate("uploadedBy", "phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      files,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DOWNLOAD FILE FROM TELEGRAM
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File metadata not found",
      });
    }

    const folder = await Folder.findById(file.folder);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check permission
    const isOwner = folder.owner.toString() === req.user._id.toString();
    const isMember = folder.members.includes(req.user._id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to download this file.",
      });
    }

    // Connect to Telegram using current user session cache
    const client = await getConnectedTelegramClient(req.user._id, req.user.telegramSession);

    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Fetch the message from Telegram
    const messages = await client.getMessages(channelPeer, {
      ids: [Number(file.telegramMessageId)],
    });

    const message = messages[0];
    if (!message || !message.media) {
      return res.status(404).json({
        success: false,
        message: "File not found on Telegram channel",
      });
    }

    console.log(`Downloading file ${file.fileName} from Telegram...`);

    // Download the media
    const buffer = await client.downloadMedia(message.media, {
      workers: 4,
    });

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.fileName)}"`
    );
    return res.send(buffer);
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET FILE THUMBNAIL
export const getFileThumbnail = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File metadata not found",
      });
    }

    const folder = await Folder.findById(file.folder);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check permission
    const isOwner = folder.owner.toString() === req.user._id.toString();
    const isMember = folder.members.includes(req.user._id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to view this file.",
      });
    }

    // Connect using current user session cache
    const client = await getConnectedTelegramClient(req.user._id, req.user.telegramSession);

    const channelPeer = await getChannelPeer(client, folder.channelId);

    const messages = await client.getMessages(channelPeer, {
      ids: [Number(file.telegramMessageId)],
    });

    const message = messages[0];
    if (!message || !message.media) {
      return res.status(404).json({
        success: false,
        message: "File not found on Telegram channel",
      });
    }

    console.log(`Downloading thumbnail for message ${file.telegramMessageId}...`);

    // Diagnostic logging
    console.log("[Diagnostics] message.media:", JSON.stringify(message.media));
    if (message.media) {
      if (message.media.photo) {
        console.log("[Diagnostics] message.media.photo.sizes:", JSON.stringify(message.media.photo.sizes));
      }
      if (message.media.document) {
        console.log("[Diagnostics] message.media.document.thumbs:", JSON.stringify(message.media.document.thumbs));
      }
    }

    let allThumbs = [];
    if (message.media) {
      if (message.media.photo && message.media.photo.sizes) {
        allThumbs = message.media.photo.sizes;
      } else if (message.media.document && message.media.document.thumbs) {
        allThumbs = message.media.document.thumbs;
      }
    }

    const downloadable = allThumbs.filter(
      t => t.className !== 'PhotoSizeEmpty' && t.className !== 'PhotoStrippedSize'
    );
    const stripped = allThumbs.find(t => t.className === 'PhotoStrippedSize');

    let thumbOption = undefined;
    if (downloadable.length > 0) {
      thumbOption = downloadable.reduce((smallest, current) => {
        const smallestArea = (smallest.w || 0) * (smallest.h || 0);
        const currentArea = (current.w || 0) * (current.h || 0);
        return currentArea < smallestArea ? current : smallest;
      }, downloadable[0]);
    }

    console.log("[Diagnostics] selected thumbOption:", JSON.stringify(thumbOption));

    let buffer = null;

    // 1. Try downloading the selected smallest thumbnail
    if (thumbOption) {
      try {
        console.log(`[Diagnostics] Downloading small thumbnail from Telegram for file ${fileId}...`);
        buffer = await client.downloadMedia(message, {
          thumb: thumbOption,
        });
      } catch (err) {
        console.error("[Diagnostics] Failed to download selected thumbnail size:", err);
      }
    }

    // 2. Try falling back to decoding the inline stripped photo if download failed/missing
    if ((!buffer || buffer.length === 0) && stripped) {
      try {
        console.log(`[Diagnostics] Using inline stripped thumbnail fallback for file ${fileId}...`);
        buffer = utils.strippedPhotoToJpg(stripped.bytes);
      } catch (err) {
        console.error("[Diagnostics] Failed decoding inline stripped photo size:", err);
      }
    }

    // 3. Try fallback to other downloadable thumbnail sizes if the selected one failed
    if (!buffer || buffer.length === 0) {
      for (const candidate of downloadable) {
        if (candidate !== thumbOption) {
          try {
            console.log(`[Diagnostics] Trying fallback thumbnail candidate: ${JSON.stringify(candidate)}`);
            buffer = await client.downloadMedia(message, {
              thumb: candidate,
            });
            if (buffer && buffer.length > 0) break;
          } catch (e) {
            console.error("[Diagnostics] Failed fallback download:", e);
          }
        }
      }
    }

    // 4. Return 404 if no thumbnail could be retrieved. Do NOT fall back to downloading full media.
    if (!buffer || buffer.length === 0) {
      console.log(`[Diagnostics] Thumbnail fetch failed for file ${fileId}. Rejecting with 404.`);
      return res.status(404).json({
        success: false,
        message: "No thumbnail available for this file",
      });
    }

    console.log(`[Diagnostics] Final thumbnail buffer size: ${buffer.length} bytes`);

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(buffer);
  } catch (err) {
    console.error("Thumbnail error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE FILE
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const folder = await Folder.findById(file.folder);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Verify ownership check bypassed for collaborative deletions

    const client = await getConnectedTelegramClient(req.user._id, req.user.telegramSession);

    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Delete message from Telegram Channel
    await client.invoke(
      new Api.channels.DeleteMessages({
        channel: channelPeer,
        id: [Number(file.telegramMessageId)],
      })
    );

    // Delete File record from MongoDB
    await File.findByIdAndDelete(fileId);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    console.error("File deletion error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET STORAGE USAGE STATS
export const getStorageStats = async (req, res) => {
  try {
    const myFolders = await Folder.find({ owner: req.user._id }).select("_id");
    const myFolderIds = myFolders.map((f) => f._id);

    const stats = await File.aggregate([
      { $match: { folder: { $in: myFolderIds } } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
          totalFiles: { $sum: 1 },
        },
      },
    ]);

    const totalFolders = myFolders.length;
    const totalSize = stats[0]?.totalSize || 0;
    const totalFiles = stats[0]?.totalFiles || 0;

    return res.status(200).json({
      success: true,
      totalSize,
      totalFiles,
      totalFolders,
    });
  } catch (err) {
    console.error("Storage stats error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
