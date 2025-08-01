// const express = require("express");
// const fs = require("fs");
// const path = require("path");

// const uploadVideo = require("../../middlewares/videoUploading");
// const {
//   sendVideoToPhone,
// } = require("../../utils/platforms/whatsApp-platform/sendVideoBaileys");
// const prisma = require("../../config/prisma");

// const router = express.Router();

// router.post(
//   "/send-video-baileys/:platformId",
//   uploadVideo.single("video"),
//   async (req, res) => {
//     const phoneNumbers = req.body.phoneNumbers?.split(",") || [];
//     const { platformId } = req.params;

//     const platform = await prisma.platform.findUnique({
//       where: { id: platformId },
//     });

//     if (!platform) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Platform not found" });
//     }

//     if (!platform.status) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Platform is paused" });
//     }

//     if (!req.file || phoneNumbers.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "phoneNumbers and video are required",
//       });
//     }

//     const videoPath = req.file.path;

//     try {
//       const results = [];

//       for (const number of phoneNumbers) {
//         const result = await sendVideoToPhone(number.trim(), videoPath);
//         results.push(result);
//       }

//       fs.unlinkSync(videoPath);

//       res.status(200).json({ success: true, data: results });
//     } catch (error) {
//       fs.existsSync(videoPath) && fs.unlinkSync(videoPath);
//       res.status(500).json({ success: false, error });
//     }
//   }
// );

// module.exports = router;

const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../../config/prisma");
const {
  sendVideoToPhone,
} = require("../../utils/platforms/whatsApp-platform/sendVideoBaileys");
const uploadVideo = require("../../middlewares/videoUploading");
const { cloudinaryUploadingVideo } = require("../../utils/cloudinaryVideo");
const {
  sendBulkMessages,
  sendVoiceMessage,
  createGroup,
  deleteGroup,
  addUserToGroup,
  sendTextToMultipleGroups,
  sendWhatsAppMediaToMultipleGroups,
} = require("../../utils/platforms/whatsApp-platform/sendBulkMessage");
const uploadMedia = require("../../middlewares/mediaUpload");
const { getSock } = require("../../platforms/whatsapp-baileys/whatsapp");
const upload = require("../../middlewares/fileUpload");
const photoUploading = require("../../middlewares/photoUploading");
const cloudinary = require("../../config/cloudinary");
const {
  authenticateUser,
  verifySuperAdmin,
} = require("../../middlewares/authMiddleware");
const {
  platformStatus,
} = require("../../middlewares/platformStatusMiddleware");
const {
  sendTextToGroup,
  sendImageToGroup,
  sendVideoToGroup,
  sendDocumentToGroup,
  sendVoiceToGroup,
  sendVoiceToGroups,
  sendToWhatsAppGroup,
} = require("../../utils/platforms/whatsApp-platform/sendBulkMessagesGroup");
const {
  addGroupCtrl,
  getAllGroupRequestsCtrl,
  acceptAddUserGroupCtrl,
  rejectAddUserGroupCtrl,
  getPendingRequestsCtrl,
  getPhoneNumbersByCountryCtrl,
} = require("../../controllers/platforms/whatsAppController");
const router = express.Router();

router.post(
  "/send-video-baileys/:platformId",
  uploadVideo.single("video"),
  async (req, res) => {
    const phoneNumbers = req.body.phoneNumbers?.split(",") || [];
    const { platformId } = req.params;

    if (!req.file || phoneNumbers.length === 0 || !platformId) {
      return res.status(400).json({
        success: false,
        message: "phoneNumbers, platformId, and video are required",
      });
    }

    const localVideoPath = req.file.path;

    try {
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
      });

      if (!platform || !platform.status) {
        fs.unlinkSync(localVideoPath);
        return res.status(403).json({
          success: false,
          message: "This platform is disabled. Message sending is not allowed.",
        });
      }
      const uploaded = await cloudinaryUploadingVideo(localVideoPath);
      const videoUrl = uploaded.secure_url;
      fs.unlinkSync(localVideoPath);

      const results = [];
      for (const number of phoneNumbers) {
        const result = await sendVideoToPhone(number.trim(), videoUrl);
        results.push(result);
      }

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      fs.existsSync(localVideoPath) && fs.unlinkSync(localVideoPath);
      res.status(500).json({ success: false, error });
    }
  }
);

router.post(
  "/send-bulk-message/:platformId",
  uploadMedia.single("file"),
  async (req, res) => {
    const { platformId } = req.params;
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return res
        .status(404)
        .json({ success: false, message: "Platform not found" });
    }

    if (!platform.status) {
      return res
        .status(404)
        .json({ success: false, message: "Platform paused" });
    }

    const { phoneNumbers, type, message } = req.body;
    const file = req.file;

    if (!phoneNumbers || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const numbers = phoneNumbers.split(",").map((n) => n.trim());

    try {
      const result = await sendBulkMessages(numbers, type, message, file);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

//   const { phone } = req.body;

//   if (!req.file || !phone) {
//     return res.status(400).json({
//       success: false,
//       message: "Phone number and document are required.",
//     });
//   }

//   const filePath = req.file.path;
//   const sock = getSock();

//   if (!sock) {
//     fs.unlinkSync(filePath);
//     return res.status(500).json({
//       success: false,
//       message: "WhatsApp not connected.",
//     });
//   }

//   try {
//     const fileBuffer = fs.readFileSync(filePath);
//     await sock.sendMessage(`${phone}@s.whatsapp.net`, {
//       document: fileBuffer,
//       mimetype: req.file.mimetype,
//       fileName: req.file.originalname,
//     });
//     fs.unlinkSync(filePath);
//     res.status(200).json({
//       success: true,
//       message: "Document sent successfully",
//     });
//   } catch (error) {
//     fs.existsSync(filePath) && fs.unlinkSync(filePath);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send document",
//       error: error.message,
//     });
//   }
// });


router.post(
  "/send-document/:platformId",
  upload.single("document"),
  async (req, res) => {
    const { platformId } = req.params;
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return res
        .status(404)
        .json({ success: false, message: "Platform not found" });
    }

    if (!platform.status) {
      return res
        .status(404)
        .json({ success: false, message: "Platform paused" });
    }

    const phoneNumbers =
      req.body.phoneNumbers?.split(",").map((p) => p.trim()) || [];

    if (!req.file || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Phone numbers and document are required.",
      });
    }

    const filePath = req.file.path;
    const sock = getSock();

    if (!sock) {
      fs.unlinkSync(filePath);
      return res.status(500).json({
        success: false,
        message: "WhatsApp not connected.",
      });
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);

      const results = await Promise.all(
        phoneNumbers.map(async (phone) => {
          const jid = `${phone}@s.whatsapp.net`;
          try {
            await sock.sendMessage(jid, {
              document: fileBuffer,
              mimetype: req.file.mimetype,
              fileName: req.file.originalname,
            });
            return { phone, status: "sent" };
          } catch (error) {
            return { phone, status: "failed", error: error.message };
          }
        })
      );

      fs.unlinkSync(filePath);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      res.status(500).json({
        success: false,
        message: "Failed to send document",
        error: error.message,
      });
    }
  }
);

router.post(
  "/send-voice",
  platformStatus,
  upload.single("audio"),
  async (req, res) => {
    const { phones } = req.body;
    const filePath = req.file?.path;

    if (!filePath || !phones) {
      return res.status(400).json({
        success: false,
        message: "Phones and audio file are required.",
      });
    }

    const phoneList = phones.split(",").map((p) => p.trim());

    try {
      const result = await sendVoiceMessage(phoneList, filePath);
      res.status(200).json(result);
    } catch (error) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.post(
  "/create-group/:platformId",
  authenticateUser,
  platformStatus,
  photoUploading.single("imageUrl"),
  async (req, res) => {
    const { platformId } = req.params;
    const lang = req.headers["accept-language"] || "en";
    const userId = req.user?.id;

    const { groupName, countryName } = req.body;

    if (!groupName || !countryName || !userId || !platformId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    try {
      const country = await prisma.country.findFirst({
        where:
          lang === "ar" ? { nameAr: countryName } : { nameEn: countryName },
      });

      if (!country) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found" });
      }

      let uploadedImageUrl = null;

      const waGroup = await createGroup(groupName, [], {
        imagePath: req.file?.path,
      });

      const whatsappJid = waGroup.id;

      if (req.file) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: "group-images",
        });
        uploadedImageUrl = uploaded.secure_url;
        fs.unlinkSync(req.file.path);
      }

      const newGroup = await prisma.platformGroup.create({
        data: {
          name: groupName,
          link: waGroup.inviteLink,
          whatsappJid,
          countryId: country.id,
          userId,
          platformId,
          imageUrl: uploadedImageUrl,
        },
      });

      res.status(201).json({
        success: true,
        group: newGroup,
        whatsapp: waGroup,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Error creating group",
        error: err.message,
      });
    }
  }
);

router.post(
  "/super-admin/create-group/:platformId",
  verifySuperAdmin,
  platformStatus,
  photoUploading.single("imageUrl"),
  async (req, res) => {
    const { platformId } = req.params;
    const lang = req.headers["accept-language"] || "en";
    const superAdminId = req.user?.id;

    const { groupName, countryName } = req.body;

    if (!groupName || !countryName || !superAdminId || !platformId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    try {
      const country = await prisma.country.findFirst({
        where:
          lang === "ar" ? { nameAr: countryName } : { nameEn: countryName },
      });

      if (!country) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found" });
      }

      let uploadedImageUrl = null;

      const waGroup = await createGroup(groupName, [], {
        imagePath: req.file?.path,
      });

      if (req.file) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: "group-images",
        });
        uploadedImageUrl = uploaded.secure_url;
        fs.unlinkSync(req.file.path);
      }

      const newGroup = await prisma.platformGroup.create({
        data: {
          name: groupName,
          link: waGroup.inviteLink,
          whatsappJid: waGroup.id,
          countryId: country.id,
          superAdminId,
          platformId,
          imageUrl: uploadedImageUrl,
        },
      });

      res.status(201).json({
        success: true,
        group: newGroup,
        whatsapp: waGroup,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Error creating group",
        error: err.message,
      });
    }
  }
);

/**
 * @method GET
 * @desc Get all groups based on the country
 */
router.get("/groups/by-country", async (req, res) => {
  const lang = req.headers["accept-language"] || "en";
  const { countryName } = req.query;

  if (!countryName) {
    return res.status(400).json({
      success: false,
      message: "Country name is required",
    });
  }

  try {
    const country = await prisma.country.findFirst({
      where: lang === "ar" ? { nameAr: countryName } : { nameEn: countryName },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    const groups = await prisma.platformGroup.findMany({
      where: {
        countryId: country.id,
      },
      include: {
        country: true,
        platform: true,
        user: true,
        superAdmin: true,
        supervisor: true,
        sales: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      country: lang === "ar" ? country.nameAr : country.nameEn,
      count: groups.length,
      groups,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * @method DELETE
 * @desc Delete group
 */
router.delete("/delete-group/:groupId", verifySuperAdmin, async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await prisma.platformGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const whatsappJid = group.whatsappJid;

    if (!whatsappJid) {
      return res
        .status(400)
        .json({ success: false, message: "Missing WhatsApp group JID" });
    }

    try {
      await deleteGroup(whatsappJid);
    } catch (err) {
      console.warn("⚠️ Failed to remove group from WhatsApp:", err.message);
    }

    await prisma.platformGroup.delete({ where: { id: groupId } });

    return res.status(200).json({
      success: true,
      message: "Group deleted from WhatsApp and database",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

/**
 * @method POST
 * @desc Add user to the group
 */
router.post("/join-group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  try {
    const group = await prisma.platformGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    await addUserToGroup(group.link, phoneNumber);

    res.status(200).json({
      success: true,
      message: "User added to WhatsApp group successfully",
    });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join group",
      error: error.message,
    });
  }
});

/**
 * @method POST
 * @desc Send media to the group
 */
router.post(
  "/send-to-group/:groupId",
  upload.single("file"),

  async (req, res) => {
    const { groupId } = req.params;
    const { type, message } = req.body;
    const file = req.file;

    try {
      const group = await prisma.platformGroup.findUnique({
        where: { id: groupId },
      });

      if (!group || !group.whatsappJid) {
        return res.status(404).json({
          success: false,
          message: "Group not found or missing WhatsApp JID",
        });
      }

      const groupJid = group.whatsappJid;
      let mediaUrl;

      if (file) {
        const upload = await cloudinary.uploader.upload(file.path, {
          resource_type: "auto",
          folder: "group-media",
          access_mode: "public",
        });
        mediaUrl = upload.secure_url;
        fs.unlinkSync(file.path);
      }

      const sock = getSock();
      if (!sock) {
        return res
          .status(500)
          .json({ success: false, message: "WhatsApp not connected" });
      }

      switch (type) {
        case "text":
          await sendTextToGroup(groupJid, message);
          break;

        case "image":
          await sendImageToGroup(groupJid, mediaUrl, message);
          break;

        case "video":
          await sendVideoToGroup(groupJid, mediaUrl, message);
          break;

        case "document":
          await sendDocumentToGroup(
            groupJid,
            mediaUrl,
            file.mimetype,
            file.originalname
          );
          break;

        case "voice":
          const outputPath = file.path.replace(path.extname(file.path), ".ogg");
          await new Promise((resolve, reject) => {
            ffmpeg(file.path)
              .audioCodec("libopus")
              .format("ogg")
              .on("end", async () => {
                const audioBuffer = fs.readFileSync(outputPath);
                await sendVoiceToGroup(groupJid, audioBuffer);
                fs.unlinkSync(file.path);
                fs.unlinkSync(outputPath);
                resolve();
              })
              .on("error", (err) => reject(err))
              .save(outputPath);
          });
          break;

        default:
          return res
            .status(400)
            .json({ success: false, message: "Unsupported type" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Message sent to group" });
    } catch (error) {
      console.error("Send to group error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @method POST
 * @desc Send Document to the group
 */
router.post(
  "/send-document-to-group/:groupId",
  upload.single("document"),
  async (req, res) => {
    const { groupId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required.",
      });
    }

    try {
      const group = await prisma.platformGroup.findUnique({
        where: { id: groupId },
      });

      if (!group || !group.whatsappJid) {
        return res.status(404).json({
          success: false,
          message: "Group not found or missing WhatsApp JID.",
        });
      }

      const filePath = req.file.path;
      const sock = getSock();

      if (!sock) {
        fs.unlinkSync(filePath);
        return res.status(500).json({
          success: false,
          message: "WhatsApp not connected.",
        });
      }

      const fileBuffer = fs.readFileSync(filePath);

      await sock.sendMessage(group.whatsappJid, {
        document: fileBuffer,
        mimetype: req.file.mimetype,
        fileName: req.file.originalname,
      });

      fs.unlinkSync(filePath);

      res.status(200).json({
        success: true,
        message: "Document sent to WhatsApp group successfully",
      });
    } catch (error) {
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      console.error("❌ Send to group error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to send document to group",
        error: error.message,
      });
    }
  }
);

/**
 * @method POST
 * @desc Send Voice message to the group
 */
router.post(
  "/send-voice-note-to-group/:groupId",
  upload.single("audio"),
  async (req, res) => {
    const { groupId } = req.params;
    const filePath = req.file?.path;

    if (!filePath || !groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID and audio file are required.",
      });
    }

    try {
      const group = await prisma.platformGroup.findUnique({
        where: { id: groupId },
      });

      if (!group || !group.whatsappJid) {
        fs.unlinkSync(filePath);
        return res.status(404).json({
          success: false,
          message: "Group not found or missing whatsappJid.",
        });
      }

      const result = await sendVoiceToGroups([group.whatsappJid], filePath);

      res.status(200).json(result);
    } catch (error) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      console.error("❌ Error sending voice to group:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send voice note",
        error: error.message,
      });
    }
  }
);

/**
 * @method POST
 * @desc Send messages for many groups
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.post("/send-to-groups", upload.single("file"), async (req, res) => {
  const { groupIds = [], countryName, type, message } = req.body;
  const filePath = req.file?.path;
  const fileName = req.file?.originalname;
  const mimeType = req.file?.mimetype;
  const lang = req.headers["accept-language"] || "en";

  if (!type || (!groupIds.length && !countryName)) {
    return res.status(400).json({
      success: false,
      message: "Please provide type and either groupIds or countryName",
    });
  }

  try {
    let groups = [];

    if (countryName) {
      const country = await prisma.country.findFirst({
        where:
          lang === "ar" ? { nameAr: countryName } : { nameEn: countryName },
      });
      if (!country) throw new Error("Country not found");

      groups = await prisma.platformGroup.findMany({
        where: { countryId: country.id },
      });
    } else {
      groups = await prisma.platformGroup.findMany({
        where: { id: { in: groupIds } },
      });
    }

    const results = [];

    for (const group of groups) {
      const jid = group.whatsappJid?.endsWith("@g.us")
        ? group.whatsappJid
        : `${group.whatsappJid}@g.us`;

      if (!jid) continue;

      try {
        await sendToWhatsAppGroup(
          type,
          jid,
          message,
          filePath,
          fileName,
          mimeType
        );
        results.push({ groupId: group.id, status: "sent" });
      } catch (error) {
        console.log("⛔ Error with group:", group.id, error.message);

        if (error.message.includes("Timed Out")) {
          await delay(1500);
          try {
            await sendToWhatsAppGroup(
              type,
              jid,
              message,
              filePath,
              fileName,
              mimeType
            );
            results.push({ groupId: group.id, status: "sent after retry" });
          } catch (retryError) {
            results.push({
              groupId: group.id,
              status: "failed",
              error: retryError.message,
            });
          }
        } else {
          results.push({
            groupId: group.id,
            status: "failed",
            error: error.message,
          });
        }
      }

      await delay(1000);
    }

    fs.existsSync(filePath) && fs.unlinkSync(filePath);

    res.status(200).json({ success: true, results });
  } catch (error) {
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get(
  "/whatsapp/groups/:countryId",
  authenticateUser,
  async (req, res) => {
    const { countryId } = req.params;

    try {
      const telegramPlatform = await prisma.platform.findFirst({
        where: {
          name: { equals: "Whatsapp", mode: "insensitive" },
        },
      });

      if (!telegramPlatform) {
        return res
          .status(404)
          .json({ message: "❌ WhatsApp platform not found" });
      }

      const groups = await prisma.platformGroup.findMany({
        where: {
          countryId,
          platformId: telegramPlatform.id,
        },
        include: {
          country: true,
          platform: true,
        },
      });

      res.json({
        message: "✅ Groups fetched successfully",
        count: groups.length,
        groups,
      });
    } catch (error) {
      console.error("❌ Error fetching telegram groups:", error);
      res.status(500).json({
        message: "❌ Internal server error",
        error: error.message,
      });
    }
  }
);

router.post("/send-multi-group-text", async (req, res) => {
  try {
    const { groupJids, message } = req.body;

    if (!Array.isArray(groupJids) || groupJids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "❌ groupJids must be an array containing group identifiers",
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "❌ Please enter the text message correctly",
      });
    }

    const result = await sendTextToMultipleGroups(groupJids, message);

    res.json({
      success: true,
      message: "✅ Messages sent successfully",
      results: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ An error occurred while sending the messages",
      error: error.message,
    });
  }
});

router.post("/send-media", upload.single("file"), async (req, res) => {
  try {
    const { groupJids, caption, type } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing file" });
    }

    let parsedGroupJids;
    try {
      parsedGroupJids = JSON.parse(groupJids);
      if (!Array.isArray(parsedGroupJids) || parsedGroupJids.length === 0) {
        throw new Error();
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "❌ groupJids must be a valid non-empty array",
      });
    }

    const result = await sendWhatsAppMediaToMultipleGroups({
      groupJids: parsedGroupJids,
      file,
      caption,
      type,
    });

    res.json(result);
  } catch (error) {
    console.error("🔴", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Failed to send media",
      error: error.message,
    });
  }
});

// ===============================Add User Group=============================
router.post("/whatsApp/add-group", authenticateUser, addGroupCtrl);
router.get(
  "/whatsApp/get-all-group-requests",
  authenticateUser,
  getAllGroupRequestsCtrl
);
router.patch(
  "/whatsApp/group-request/:requestId/approve",
  authenticateUser,
  acceptAddUserGroupCtrl
);
router.patch(
  "/whatsApp/group-request/:requestId/reject",
  authenticateUser,
  rejectAddUserGroupCtrl
);
router.get(
  "/whatsApp/pending-groups",
  authenticateUser,
  getPendingRequestsCtrl
);
router.get("/whatsApp/countries-phoneNumbers", getPhoneNumbersByCountryCtrl)
module.exports = router;

