const router = require("express").Router();

const {
  saveTelegramSession,
} = require("../../utils/platforms/telegram-platform/saveTelegramSession");
const { authenticateUser } = require("../../middlewares/authMiddleware");
const {
  sendCode,
  verifyCode,
} = require("../../platforms/telegram/telegramClient");
const photoUploading = require("../../middlewares/photoUploading");
const {
  createTelegramGroup,
  deleteTelegramGroup,
  sendTelegramMessage,
  sendTelegramMediaMessageWithMulter,
  sendTelegramMediaMessageToMultipleGroups,
  sendTelegramTextToMultipleGroups,
} = require("../../platforms/telegram/telegramGroup");
const prisma = require("../../config/prisma");
const upload = require("../../middlewares/fileUpload");
const {
  getTelegramNumbersByCountryCtrl,
  sendMultiMessagesCtrl,
} = require("../../controllers/platforms/telegramController");

router.post("/telegram/send-code", authenticateUser, async (req, res) => {
  console.log("✅ req.body:", req.body);

  const { phoneNumber } = req.body;

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return res
      .status(400)
      .json({ message: "📛 phoneNumber is required and must be a string" });
  }

  try {
    const phoneCodeHash = await sendCode({
      phoneNumber,
      userId: req.user.id,
      userType: req.user.role,
    });

    res.json({ message: "📩 Code sent", phoneCodeHash });
  } catch (err) {
    console.error("❌ Error sending code:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/telegram/verify-code", authenticateUser, async (req, res) => {
  const { phoneNumber, code } = req.body;
  const { id: userId, role, userType: regularType } = req.user;

  const userType = role || regularType;

  if (!phoneNumber || !code) {
    return res
      .status(400)
      .json({ message: "Phone number and code are required" });
  }

  try {
    const session = await verifyCode({
      phoneNumber,
      code,
      userType,
      userId,
      saveTelegramSession,
    });

    res.json({ message: "✅ Telegram login successful", session });
  } catch (err) {
    console.error("Telegram login error:", err);
    res
      .status(500)
      .json({ message: "Telegram login failed", error: err.message });
  }
});

router.post(
  "/telegram/create-group/:platformId",
  authenticateUser,
  photoUploading.single("imageUrl"),
  async (req, res) => {
    const { groupName, countryName } = req.body;
    const { platformId } = req.params;
    const { id: userId, role } = req.user;
    const imageUrl = req.file ? req.file.path : null;

    if (!groupName || !countryName || !platformId) {
      return res.status(400).json({ message: "❌ Missing required fields" });
    }

    try {
      const country = await prisma.country.findFirst({
        where: {
          OR: [{ nameAr: countryName }, { nameEn: countryName }],
        },
      });

      if (!country) {
        return res.status(404).json({ message: "❌ Country not found" });
      }

      const sessionEntry = await prisma.telegramSession.findFirst({
        where: {
          ...(role === "REGULAR_USER" && { userId }),
          ...(role === "SUPERVISOR" && { supervisorId: userId }),
          ...(role === "SALES" && { salesId: userId }),
          ...(role === "SUPER_ADMIN" && { superAdminId: userId }),
        },
      });

      if (!sessionEntry?.session) {
        return res
          .status(401)
          .json({ message: "❌ Telegram session not found" });
      }

      const group = await createTelegramGroup({
        session: sessionEntry.session,
        groupName,
        imageUrl,
        countryId: country.id,
        platformId,
        userId,
        userType: role,
      });

      res.json({ message: "✅ Group created successfully", group });
    } catch (error) {
      console.error("❌ Error creating group:", error);
      res
        .status(500)
        .json({ message: "❌ Internal server error", error: error.message });
    }
  }
);

router.get("/groups/:countryId", authenticateUser, async (req, res) => {
  const { countryId } = req.params;

  try {
    const telegramPlatform = await prisma.platform.findFirst({
      where: {
        name: { equals: "Telegram", mode: "insensitive" },
      },
    });

    if (!telegramPlatform) {
      return res
        .status(404)
        .json({ message: "❌ Telegram platform not found" });
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
});

router.get(
  "/groups-by-platform-name/:platformName",
  authenticateUser,
  async (req, res) => {
    const { platformName } = req.params;

    try {
      // أول حاجة نجيب المنصة من اسمها
      const platform = await prisma.platform.findUnique({
        where: { name: platformName },
      });

      if (!platform) {
        return res.status(404).json({
          message: "❌ Platform not found",
        });
      }

      const groups = await prisma.platformGroup.findMany({
        where: {
          platformId: platform.id,
        },
        include: {
          country: true,
          platform: true,
          user: true,
        },
      });

      res.json({
        message: "✅ Groups fetched successfully",
        count: groups.length,
        groups,
      });
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      res.status(500).json({
        message: "❌ Internal server error",
        error: error.message,
      });
    }
  }
);

// router.get("/countries/:platformName", authenticateUser, async (req, res) => {
//   const { platformName } = req.params;
//   const lang = (req.headers["accept-language"] || "ar").split("-")[0];

//   if (!platformName) {
//     return res.status(400).json({ message: "The name of platform required" });
//   }

//   const countries = await prisma.country.findMany({
//     where: {
//       PlatformGroup: {
//         some: {
//           platform: {
//             name: platformName,
//           },
//         },
//       },
//     },
//     select: {
//       id: true,
//       nameAr: true,
//       nameEn: true,
//       flagUrl: true,
//       code: true,
//       _count: {
//         select: {
//           PlatformGroup: {
//             where: {
//               platform: {
//                 name: platformName,
//               },
//             },

//           },
//         },
//       },
//     },
//   });

//   const localizedCountries = countries.map((country) => ({
//     id: country.id,
//     name: lang === "en" ? country.nameEn : country.nameAr,
//     flagUrl: country.flagUrl,
//     code: country.code,
//     groupsCount: country._count.PlatformGroup,
//   }));

//   res.status(200).json({
//     message: `✅ Countries with groups on ${platformName}`,
//     count: localizedCountries.length,
//     countries: localizedCountries,
//   });
// });

router.get("/countries/:platformName", authenticateUser, async (req, res) => {
  const { platformName } = req.params;
  const lang = (req.headers["accept-language"] || "ar").split("-")[0];

  if (!platformName) {
    return res.status(400).json({ message: "The name of platform required" });
  }

  const countries = await prisma.country.findMany({
    where: {
      PlatformGroup: {
        some: {
          platform: {
            name: platformName,
          },
        },
      },
    },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      flagUrl: true,
      code: true,
      PlatformGroup: {
        where: {
          platform: {
            name: platformName,
          },
        },
        select: {
          id: true,
          name: true,
          link: true,
          whatsappJid: true,
        },
      },
    },
  });

  const localizedCountries = countries.map((country) => ({
    id: country.id,
    name: lang === "en" ? country.nameEn : country.nameAr,
    flagUrl: country.flagUrl,
    code: country.code,
    groupsCount: country.PlatformGroup.length,
    groups: country.PlatformGroup,
  }));

  res.status(200).json({
    message: `✅ Countries with groups on ${platformName}`,
    count: localizedCountries.length,
    countries: localizedCountries,
  });
});

router.delete(
  "/telegram/groups/:groupId",
  authenticateUser,
  async (req, res) => {
    const groupId = req.params.groupId;
    const { id: userId, role } = req.user;

    try {
      const result = await deleteTelegramGroup(groupId, role, userId);
      res.status(200).json(result);
    } catch (err) {
      console.error("❌ Failed to delete group:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.post(
  "/telegram/send-message/:groupId",
  upload.single("file"),
  authenticateUser,
  async (req, res) => {
    const { groupId } = req.params;
    const { type, messageText } = req.body;
    const file = req.file?.path;

    const userType = req.user?.role;
    const userId = req.user?.id;

    const validTypes = ["text", "photo", "audio", "file", "voice"];

    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "❌ نوع الرسالة غير مدعوم",
      });
    }

    if (type === "text" && !messageText) {
      return res.status(400).json({
        success: false,
        message: "❌ لا يمكن إرسال رسالة نصية بدون محتوى",
      });
    }

    if (type !== "text" && !file) {
      return res.status(400).json({
        success: false,
        message: "❌ يجب إرسال ملف مع هذا النوع من الرسائل",
      });
    }

    try {
      await sendTelegramMessage({
        groupId,
        userId,
        userType,
        type,
        contentPath: file,
        messageText,
      });

      return res.json({
        success: true,
        message: "✅ Message sent successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "❌ Failed to send message",
        error: err.message,
      });
    }
  }
);

// router.post(
//   "/telegram/send-message",
//   upload.single("file"),
//   async (req, res) => {
//     const { groupId, userId, userType, caption } = req.body;
//     const filePath = req.file?.path;

//     if (!filePath) {
//       return res.status(400).json({ success: false, message: "❌ File not uploaded" });
//     }

//     const result = await sendTelegramMessage({
//       groupId,
//       userId,
//       userType,
//       filePath,
//       caption,
//     });

//     return res.status(result.success ? 200 : 400).json(result);
//   }
// );

router.post(
  "/telgram/send-media-message/:groupId",
  authenticateUser,
  upload.single("file"),
  async (req, res) => {
    const { groupId } = req.params;
    const userType = req.user?.role;
    const userId = req.user?.id;
    const { caption } = req.body;
    const filePath = req.file?.path;

    const group = await prisma.platformGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Group not found" });
    }

    if (!userType) {
      return res
        .status(400)
        .json({ success: false, message: "❌ User type not found" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "❌ User id not found" });
    }

    if (!filePath) {
      return res
        .status(400)
        .json({ success: false, message: "❌ File not uploaded" });
    }

    const result = await sendTelegramMediaMessageWithMulter({
      groupId,
      userId,
      userType,
      filePath,
      caption,
    });

    return res.status(result.success ? 200 : 400).json(result);
  }
);

router.post(
  "/telgram/send-media-to-groups",
  upload.single("file"),
  async (req, res) => {
    try {
      const { groupIds, caption } = req.body;
      const userId = req.user?.id;
      const userType = req.user?.role;

      if (!req.file) {
        return res.status(400).json({ message: "❌ Failed to upload file" });
      }

      let parsedGroupIds;
      try {
        parsedGroupIds = JSON.parse(groupIds);
        if (!Array.isArray(parsedGroupIds)) throw new Error();
      } catch {
        return res
          .status(400)
          .json({ message: "❌ groupIds must be a valid JSON array" });
      }

      const result = await sendTelegramMediaMessageToMultipleGroups({
        groupIds: parsedGroupIds,
        userId,
        userType,
        filePath: req.file.path,
        caption,
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error("🔴 Error in route:", err.message);
      return res
        .status(500)
        .json({ message: "❌ Internal server error", error: err.message });
    }
  }
);

router.post("/telgram/send-multi-text", async (req, res) => {
  try {
    const { groupIds, messageText } = req.body;
    const userType = req.user?.role;
    const userId = req.user?.id;

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "❌ groupIds must be a valid JSON array",
      });
    }

    const result = await sendTelegramTextToMultipleGroups({
      groupIds,
      userId,
      userType,
      messageText,
    });

    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("🔴 Route Error:", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Server error while sending message",
      error: error.message,
    });
  }
});

router.get("/telegram/countries-phoneNumbers", getTelegramNumbersByCountryCtrl);
router.post(
  "/telegram/send-multi-message",
  authenticateUser,
  upload.single("file"),
  sendMultiMessagesCtrl
);

module.exports = router;
