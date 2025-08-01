const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");

const {
  authenticateUser,
  verifySuperAdmin,
} = require("../../middlewares/authMiddleware");
const {
  createTelegramChannel,
  sendTelegramMessageToChannels,
} = require("../../platforms/telegram/TelegramChannel");
const {
  platformStatus,
} = require("../../middlewares/platformStatusMiddleware");
const upload = require("../../middlewares/fileUpload");
const {
  addUserChannelCtrl,
  acceptAddingUserChannelCtrl,
  refuseAddingUserChannelCtrl,
  getPendingAddingChannelsCtrl,
} = require("../../controllers/platforms/telegramController");

router.post(
  "/telegram/create-channel/:platformId",
  platformStatus,
  authenticateUser,
  async (req, res) => {
    try {
      const { platformId } = req.params;
      const { countryName, channelName, description } = req.body;

      const userId = req.user?.id;
      const userType = req.user?.role;
      const language = req.headers["accept-language"] === "en" ? "en" : "ar";

      if (!userId || !userType) {
        return res.status(401).json({
          message: language === "en" ? "❌ Unauthorized" : "❌ غير مصرح",
        });
      }

      if (!countryName) {
        return res.status(400).json({
          message:
            language === "en"
              ? "❌ Country name required"
              : "❌ اسم الدولة مطلوب",
        });
      }

      if (!channelName) {
        return res.status(400).json({
          message:
            language === "en"
              ? "❌ Channel name required"
              : "❌ اسم القناة مطلوب",
        });
      }
      const result = await createTelegramChannel({
        countryName,
        platformId,
        channelName,
        description,
        userId,
        userType,
        language,
      });

      res.status(201).json({
        message:
          language === "en"
            ? "✅ Channel created successfully"
            : "✅ تم إنشاء القناة بنجاح",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error creating channel:", error.message);
      const language = req.headers["accept-language"] === "en" ? "en" : "ar";
      res.status(500).json({
        message:
          language === "en" ? `❌ ${error.message}` : `❌ ${error.message}`,
      });
    }
  }
);

router.get(
  "/telegram/countries-with-channels",
  verifySuperAdmin,
  async (req, res) => {
    try {
      const acceptLanguage = req.headers["accept"] || "ar";

      const telegramPlatform = await prisma.platform.findFirst({
        where: { name: "Telegram" },
      });

      if (!telegramPlatform) {
        return res.status(404).json({
          message:
            acceptLanguage === "en"
              ? "❌ Telegram platform not found"
              : "❌ منصة تيليجرام غير موجودة",
        });
      }

      const countries = await prisma.country.findMany({
        where: {
          PlatformChannel: {
            some: {
              platformId: telegramPlatform.id,
            },
          },
        },
        include: {
          PlatformChannel: {
            where: {
              platformId: telegramPlatform.id,
            },
            select: {
              id: true,
              name: true,
              description: true,
              link: true,
              telegramId: true,
              accessHash: true,
              createdAt: true,
            },
          },
        },
      });

      const totalCountries = countries.length;
      const totalChannels = countries.reduce(
        (sum, country) => sum + country.PlatformChannel.length,
        0
      );

      const responseData = countries.map((country) => ({
        ...country,
        name: acceptLanguage === "en" ? country.nameEn : country.nameAr,
        channels: country.PlatformChannel.map((channel) => ({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          link: channel.link,
          telegramId: channel.telegramId,
          accessHash: channel.accessHash,
          createdAt: channel.createdAt,
        })),
      }));

      res.status(200).json({
        success: true,
        totalCountries,
        totalChannels,
        countries: responseData,
      });
    } catch (error) {
      console.error(
        "❌ Error fetching countries with Telegram channels:",
        error
      );
      res.status(500).json({
        message:
          acceptLanguage === "en"
            ? "❌ Error fetching data"
            : "❌ حدث خطأ أثناء جلب الدول",
      });
    }
  }
);

router.post(
  "/telegram/send-message-to-channels",
  authenticateUser,
  upload.single("file"),
  async (req, res) => {
    try {
      let { channelIds, type, messageText } = req.body;
      const userId = req.user?.id;
      const userType = req.user?.role;

      if (typeof channelIds === "string") {
        try {
          channelIds = JSON.parse(channelIds);
        } catch {
          return res
            .status(400)
            .json({ message: "❌ channelIds must be a valid JSON array" });
        }
      }

      if (
        !channelIds ||
        !Array.isArray(channelIds) ||
        channelIds.length === 0
      ) {
        return res.status(400).json({ message: "❌ channelIds is required" });
      }

      let contentPath = null;
      if (["image", "video", "file"].includes(type)) {
        if (!req.file) {
          return res
            .status(400)
            .json({ message: "❌ File is required for this message type" });
        }
        contentPath = req.file.path;
      }

      await sendTelegramMessageToChannels({
        channelIds,
        userId,
        userType,
        type,
        contentPath,
        messageText,
      });

      res.status(200).json({ message: "✅ Messages sent successfully" });
    } catch (err) {
      console.error("❌ Error sending messages:", err);
      res.status(500).json({ message: "❌ Failed to send messages" });
    }
  }
);

// ===============================Linked Channel======================================

router.post("/telegram/add-channel", authenticateUser, addUserChannelCtrl);
router.put(
  "/telegram/:requestId/approve",
  authenticateUser,
  acceptAddingUserChannelCtrl
);
router.patch(
  "/telegram/:requestId/reject",
  authenticateUser,
  refuseAddingUserChannelCtrl
);
router.get(
  "/telegram/pending-channels",
  authenticateUser,
  getPendingAddingChannelsCtrl
);
module.exports = router;
