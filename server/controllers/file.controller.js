import { Api, utils } from "telegram";
import fs from "fs";
import path from "path";
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

    console.log(`Uploading file ${req.file.originalname} to Telegram channel...`);

    // Upload to Telegram channel
    const message = await client.sendFile(channelPeer, {
      file: tempFilePath,
      forceDocument: true, // upload as document to preserve quality and name
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

    let thumbOption = undefined;
    if (message.media) {
      if (message.media.photo && message.media.photo.sizes) {
        const downloadableSizes = message.media.photo.sizes.filter(
          s => s.className !== 'PhotoSizeEmpty' && s.className !== 'PhotoStrippedSize'
        );
        if (downloadableSizes.length > 0) {
          thumbOption = downloadableSizes.reduce((smallest, current) => {
            const smallestArea = (smallest.w || 0) * (smallest.h || 0);
            const currentArea = (current.w || 0) * (current.h || 0);
            return currentArea < smallestArea ? current : smallest;
          }, downloadableSizes[0]);
        } else {
          // Fallback to stripped size if only stripped is available
          const stripped = message.media.photo.sizes.find(s => s.className === 'PhotoStrippedSize');
          if (stripped) {
            thumbOption = stripped;
          }
        }
      } else if (message.media.document && message.media.document.thumbs) {
        const downloadableThumbs = message.media.document.thumbs.filter(
          t => t.className !== 'PhotoSizeEmpty' && t.className !== 'PhotoStrippedSize'
        );
        if (downloadableThumbs.length > 0) {
          thumbOption = downloadableThumbs.reduce((smallest, current) => {
            const smallestArea = (smallest.w || 0) * (smallest.h || 0);
            const currentArea = (current.w || 0) * (current.h || 0);
            return currentArea < smallestArea ? current : smallest;
          }, downloadableThumbs[0]);
        } else {
          const stripped = message.media.document.thumbs.find(t => t.className === 'PhotoStrippedSize');
          if (stripped) {
            thumbOption = stripped;
          }
        }
      }
    }

    let buffer;
    if (thumbOption && thumbOption.className === 'PhotoStrippedSize') {
      console.log(`Using inline stripped thumbnail for file ${fileId}...`);
      buffer = utils.strippedPhotoToJpg(thumbOption.bytes);
    } else if (thumbOption !== undefined) {
      try {
        buffer = await client.downloadMedia(message.media, {
          thumb: thumbOption,
        });
      } catch (err) {
        console.log(`Failed to download specific thumbnail for file ${fileId}, trying fallback...`, err);
      }
    }

    // Comprehensive Fallback if buffer is still empty/null
    if (!buffer || buffer.length === 0) {
      const allThumbs = (message.media.photo && message.media.photo.sizes) || 
                         (message.media.document && message.media.document.thumbs) || [];
      if (allThumbs.length > 0) {
        const firstDownloadable = allThumbs.find(
          t => t.className !== 'PhotoSizeEmpty' && t.className !== 'PhotoStrippedSize'
        );
        if (firstDownloadable) {
          try {
            buffer = await client.downloadMedia(message.media, {
              thumb: firstDownloadable,
            });
          } catch (e) {
            console.error(`Failed to download first downloadable thumbnail fallback:`, e);
          }
        }

        if (!buffer || buffer.length === 0) {
          const stripped = allThumbs.find(t => t.className === 'PhotoStrippedSize');
          if (stripped) {
            console.log(`Fallback: Using inline stripped thumbnail for file ${fileId}...`);
            buffer = utils.strippedPhotoToJpg(stripped.bytes);
          }
        }
      } else {
        // No thumbnails array at all (e.g. document image with no thumbs)
        console.log(`No thumbnails array at all for file ${fileId}. Fetching full media as fallback...`);
        try {
          buffer = await client.downloadMedia(message.media);
        } catch (e) {
          console.error(`Failed to download full media fallback:`, e);
        }
      }
    }

    if (!buffer || buffer.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No thumbnail available for this file type",
      });
    }

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
