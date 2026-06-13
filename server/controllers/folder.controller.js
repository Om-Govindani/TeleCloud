import { Api } from "telegram";
import Folder from "../models/Folder.js";
import File from "../models/File.js";
import User from "../models/User.js";
import { createTelegramClient } from "../services/telegram.service.js";

const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const getChannelPeer = async (client, channelId) => {
  try {
    return await client.getInputEntity(BigInt(channelId));
  } catch (err) {
    console.log("Channel not in cache, fetching dialogs...");
    await client.getDialogs({});
    return await client.getInputEntity(BigInt(channelId));
  }
};

const resolveTelegramUserByPhone = async (client, phone) => {
  const contactResult = await client.invoke(
    new Api.contacts.ImportContacts({
      contacts: [
        new Api.InputPhoneContact({
          clientId: BigInt(Math.floor(Math.random() * 100000000)),
          phone: phone,
          firstName: "TeleCloud",
          lastName: phone,
        }),
      ],
    })
  );
  const userEntity = contactResult.users[0];
  if (!userEntity) {
    throw new Error("Could not resolve Telegram user for this phone number");
  }
  return userEntity;
};

// CREATE FOLDER
export const createFolder = async (req, res) => {
  try {
    const { folderName, category } = req.body;
    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: "Folder name required",
      });
    }

    const trimmedFolderName = folderName.trim();

    // Check duplicate folder (owner + folderName)
    const existingFolder = await Folder.findOne({
      owner: req.user._id,
      title: { $regex: new RegExp(`^${escapeRegex(trimmedFolderName)}::`, "i") },
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: "Folder with this name already exists",
      });
    }

    const client = createTelegramClient(req.user.telegramSession);
    await client.connect();

    const folderTitle = `${trimmedFolderName}::${category || "General"}::TeleCloud`;

    const result = await client.invoke(
      new Api.channels.CreateChannel({
        title: folderTitle,
        about: `Telegram Folder : ${trimmedFolderName}`,
        megagroup: false,
        broadcast: true,
      })
    );
    const channel = result.chats[0];

    const peer = await client.getInputEntity(channel);

    // Archive the created channel
    await client.invoke(
      new Api.folders.EditPeerFolders({
        folderPeers: [
          new Api.InputFolderPeer({
            peer,
            folderId: 1,
          }),
        ],
      })
    );

    // Mute Channel Notifications forever
    await client.invoke(
      new Api.account.UpdateNotifySettings({
        peer: new Api.InputNotifyPeer({
          peer,
        }),
        settings: new Api.InputPeerNotifySettings({
          muteUntil: 2147483647,
          showPreviews: false,
          silent: true,
        }),
      })
    );

    const folder = await Folder.create({
      title: folderTitle,
      category: category || "General",
      channelId: channel.id.toString(),
      owner: req.user._id,
      members: [],
    });

    return res.status(201).json({
      success: true,
      message: "Folder Created Successfully",
      folder,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET USER FOLDERS (My Folders & Shared With Me)
export const getFolders = async (req, res) => {
  try {
    const myFolders = await Folder.find({ owner: req.user._id })
      .populate("owner", "phone")
      .populate("members", "phone")
      .sort({ createdAt: -1 });

    const sharedWithMe = await Folder.find({ members: req.user._id })
      .populate("owner", "phone")
      .populate("members", "phone")
      .sort({ createdAt: -1 });

    // Fetch the last uploaded file for each folder
    const myFoldersWithLastFile = await Promise.all(
      myFolders.map(async (folder) => {
        const lastFile = await File.findOne({ folder: folder._id })
          .sort({ createdAt: -1 })
          .select("fileName mimeType size");
        return {
          ...folder.toObject(),
          lastFile,
        };
      })
    );

    const sharedWithMeWithLastFile = await Promise.all(
      sharedWithMe.map(async (folder) => {
        const lastFile = await File.findOne({ folder: folder._id })
          .sort({ createdAt: -1 })
          .select("fileName mimeType size");
        return {
          ...folder.toObject(),
          lastFile,
        };
      })
    );

    return res.status(200).json({
      success: true,
      myFolders: myFoldersWithLastFile,
      sharedWithMe: sharedWithMeWithLastFile,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE FOLDER NAME & CATEGORY
export const updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { folderName, category } = req.body;

    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: "Folder name required",
      });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Verify ownership
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can edit folder settings",
      });
    }

    const trimmedFolderName = folderName.trim();

    // Check duplicate folder names per owner excluding this folder
    const existingFolder = await Folder.findOne({
      _id: { $ne: folderId },
      owner: req.user._id,
      title: { $regex: new RegExp(`^${escapeRegex(trimmedFolderName)}::`, "i") },
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: "Another folder with this name already exists",
      });
    }

    const client = createTelegramClient(req.user.telegramSession);
    await client.connect();

    const channelPeer = await getChannelPeer(client, folder.channelId);

    const newTitle = `${trimmedFolderName}::${category || "General"}::TeleCloud`;

    // Edit Telegram channel title
    await client.invoke(
      new Api.channels.EditTitle({
        channel: channelPeer,
        title: newTitle,
      })
    );

    folder.title = newTitle;
    folder.category = category || "General";
    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Folder settings updated successfully",
      folder,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE FOLDER
export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check ownership
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can delete this folder",
      });
    }

    const client = createTelegramClient(req.user.telegramSession);
    await client.connect();

    // Resolve channel peer
    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Delete Telegram Channel
    await client.invoke(
      new Api.channels.DeleteChannel({
        channel: channelPeer,
      })
    );

    // Delete matching File metadata
    await File.deleteMany({ folder: folder._id });

    // Delete Folder record
    await Folder.findByIdAndDelete(folderId);

    return res.status(200).json({
      success: true,
      message: "Folder and all its files deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ADD FOLDER MEMBER (Supports Phone or Username)
export const addMember = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { phone } = req.body; // Can be phone or Telegram username

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number or username is required",
      });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Verify ownership
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can add members",
      });
    }

    const input = phone.trim();
    let targetUser = null;

    // Resolve user from MongoDB using phone or username
    if (input.startsWith("@")) {
      targetUser = await User.findOne({ username: input.substring(1) });
    } else if (isNaN(input) && !input.startsWith("+")) {
      targetUser = await User.findOne({ username: input });
    } else {
      targetUser = await User.findOne({ phone: input });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in TeleCloud. They must log in at least once.",
      });
    }

    // Check if already owner or member
    if (folder.owner.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Owner cannot be added as a member",
      });
    }

    if (folder.members.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this folder",
      });
    }

    const client = createTelegramClient(req.user.telegramSession);
    await client.connect();

    // Resolve channel peer
    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Import contact & resolve Telegram entity (always using phone number stored in User)
    const targetUserEntity = await resolveTelegramUserByPhone(client, targetUser.phone);

    // Invite user to Telegram Channel
    await client.invoke(
      new Api.channels.InviteToChannel({
        channel: channelPeer,
        users: [targetUserEntity],
      })
    );

    // Save member to MongoDB
    folder.members.push(targetUser._id);
    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      members: folder.members,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// REMOVE FOLDER MEMBER
export const removeMember = async (req, res) => {
  try {
    const { folderId, memberId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Verify ownership
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can remove members",
      });
    }

    // Verify member exists in folder
    if (!folder.members.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this folder",
      });
    }

    // Find target user to get their phone number
    const targetUser = await User.findById(memberId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Member user not found",
      });
    }

    const client = createTelegramClient(req.user.telegramSession);
    await client.connect();

    // Resolve channel peer
    const channelPeer = await getChannelPeer(client, folder.channelId);

    // Resolve Telegram user entity
    const targetUserEntity = await resolveTelegramUserByPhone(client, targetUser.phone);

    // Ban/Kick user from Telegram Channel
    await client.invoke(
      new Api.channels.EditBanned({
        channel: channelPeer,
        participant: targetUserEntity,
        bannedRights: new Api.ChatBannedRights({
          untilDate: 0, // Permanent
          viewMessages: true, // true kicks them from channel
          sendMessages: true,
          sendMedia: true,
          sendStickers: true,
          sendGifs: true,
          sendGames: true,
          sendInline: true,
          embedLinks: true,
        }),
      })
    );

    // Remove from MongoDB members list
    folder.members = folder.members.filter((id) => id.toString() !== memberId.toString());
    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      members: folder.members,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};