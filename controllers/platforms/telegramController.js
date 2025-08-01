require("dotenv").config();

const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");
const {
  getTelegramIdAndHashFromLink,
} = require("../../platforms/telegram/TelegramChannel");
const {
  checkTelegramAccount,
} = require("../../platforms/telegram/telegramClient");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const {
  sendMessageToMultiplePhones,
} = require("../../platforms/telegram/TelegramPhoneNumbers");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

/**
 * @method POST
 * @desc Add user channel
 */
module.exports.addUserChannelCtrl = asyncHandler(async (req, res) => {
  const { name, link, countryId } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const telegramPlatform = await prisma.platform.findUnique({
    where: { name: "Telegram" },
  });

  if (!telegramPlatform)
    return res.status(404).json({ message: "❌ Telegram platform not found" });

  if (!telegramPlatform.status)
    return res.status(404).json({ message: "❌ Telegram platform paused" });

  const requestData = {
    name,
    link,
    countryId,
    platformId: telegramPlatform.id,
    status: "PENDING",
  };

  switch (userRole) {
    case "REGULAR_USER":
      requestData.regularUserId = userId;
      break;
    case "SUPERVISOR":
      requestData.supervisorId = userId;
      break;
    case "SALES":
      requestData.salesId = userId;
      break;
    case "SUPER_ADMIN":
      requestData.superAdminId = userId;
      break;
    default:
      return res.status(403).json({ message: "❌ Invalid role" });
  }

  const newRequest = await prisma.platformChannelRequest.create({
    data: requestData,
  });

  res
    .status(201)
    .json({ message: "✅ Channel request created", data: newRequest });
});

/**
 * @method PUT
 * @desc Accept adding user channel
 */
module.exports.acceptAddingUserChannelCtrl = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const adminId = req.user.id;
  const adminRole = req.user.role;

  const request = await prisma.platformChannelRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "❌ Request not found",
    });
  }

  if (request.status !== "PENDING") {
    return res.status(400).json({
      success: false,
      message: "❌ Request has already been processed",
    });
  }

  let telegramId, accessHash;
  try {
    const result = await getTelegramIdAndHashFromLink(request.link);
    telegramId = result.telegramId;
    accessHash = result.accessHash;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `❌ Failed to fetch Telegram info: ${error.message}`,
    });
  }

  try {
    const [newChannel] = await prisma.$transaction([
      prisma.platformChannel.create({
        data: {
          name: request.name,
          description: request.description,
          link: request.link,
          telegramId,
          accessHash,
          imageUrl: request.imageUrl,
          countryId: request.countryId,
          platformId: request.platformId,
          regularUserId: request.regularUserId,
          supervisorId: request.supervisorId,
          salesId: request.salesId,
          superAdminId: adminRole === "SUPER_ADMIN" ? adminId : null,
        },
      }),

      prisma.platformChannelRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          telegramId,
          accessHash,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "✅ The request has been approved and the channel added successfully",
      channel: newChannel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `❌ Error while saving to the database: ${error.message}`,
    });
  }
});

/**
 * @method PATCH
 * @desc Refuse the request of adding user channel
 */
module.exports.refuseAddingUserChannelCtrl = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await prisma.platformChannelRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });
  }

  if (request.status !== "PENDING") {
    return res.status(400).json({
      success: false,
      message: "❌ Request has already been processed",
    });
  }

  const rejectedRequest = await prisma.platformChannelRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
    },
  });

  return res.status(200).json({
    success: true,
    message: "✅ The request has been rejected",
    rejectedRequest,
  });
});

/**
 * @method GET
 * @desc Get all pending requests
 */
module.exports.getPendingAddingChannelsCtrl = asyncHandler(async (req, res) => {
  const pendingRequests = await prisma.platformChannelRequest.findMany({
    where: { status: "PENDING" },
    include: {
      country: true,
      platform: true,
      user: true,
      superAdmin: true,
      supervisor: true,
      sales: true,
    },
  });

  if (pendingRequests.length < 1) {
    return res.status(404).json({ message: "There are no requests" });
  }

  return res
    .status(200)
    .json({ success: true, count: pendingRequests.length, pendingRequests });
});

/**
 * @method GET
 * @desc Get all phoneNumbers that have account at telegram
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports.getTelegramNumbersByCountryCtrl = asyncHandler(
  async (req, res) => {
    const sessionEntry = await prisma.telegramSession.findFirst({
      where: {
        session: {
          notIn: ["", "null"],
        },
      },
    });

    if (!sessionEntry?.session) {
      return res.status(400).json({
        success: false,
        message: "No valid Telegram session found",
      });
    }

    const sessionStr = sessionEntry.session;

    const client = new TelegramClient(
      new StringSession(sessionStr),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();

    // نجيب المستخدمين اللي عندهم أرقام
    const users = await prisma.regularUser.findMany({
      where: {
        phoneNumber: {
          notIn: ["", "null"],
        },
      },
      select: {
        phoneNumber: true,
        country: true,
      },
    });

    const countries = await prisma.country.findMany({
      select: {
        nameAr: true,
        nameEn: true,
        flagUrl: true,
      },
    });

    const grouped = {};

    for (const user of users) {
      const number = user.phoneNumber;
      const userCountry = user.country?.trim();

      const matchedCountry = countries.find(
        (c) =>
          c.nameAr.trim() === userCountry ||
          c.nameEn.trim().toLowerCase() === userCountry?.toLowerCase()
      );

      const key = matchedCountry
        ? `${matchedCountry.nameEn}-${matchedCountry.nameAr}`
        : "Unknown";

      if (!grouped[key]) {
        grouped[key] = {
          nameEn: matchedCountry?.nameEn || "Unknown",
          nameAr: matchedCountry?.nameAr || "غير معروف",
          flagUrl: matchedCountry?.flagUrl || null,
          validNumbers: [],
          invalidNumbers: [],
        };
      }

      try {
        const result = await checkTelegramAccount(client, number);
        if (result.exists) {
          grouped[key].validNumbers.push(number);
        } else {
          grouped[key].invalidNumbers.push(number);
        }
      } catch (error) {
        console.error(`❌ Error checking number ${number}:`, error.message);
        grouped[key].invalidNumbers.push(number);
      }
    }

    await client.disconnect();

    const groupedResult = Object.values(grouped).map((group) => ({
      nameEn: group.nameEn,
      nameAr: group.nameAr,
      flagUrl: group.flagUrl,
      total: group.validNumbers.length + group.invalidNumbers.length,
      telegramAccounts: group.validNumbers.length,
      noTelegramAccounts: group.invalidNumbers.length,
      validNumbers: group.validNumbers,
      invalidNumbers: group.invalidNumbers,
    }));

    return res.status(200).json({
      success: true,
      totalCountries: groupedResult.length,
      details: groupedResult,
    });
  }
);

/**
 * @method POST
 * @desc Send multi message to users
 */
module.exports.sendMultiMessagesCtrl = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.role;
  const { message, phoneNumbers, type } = req.body;

  const phonesArray = phoneNumbers.split(",").map((p) => p.trim());

  const where = {};
  if (userType === "REGULAR_USER") where.userId = userId;
  else if (userType === "SUPERVISOR") where.supervisorId = userId;
  else if (userType === "SALES") where.salesId = userId;
  else if (userType === "SUPER_ADMIN") where.superAdminId = userId;
  else return res.status(400).json({ error: "❌ Unknown user type" });

  const session = await prisma.telegramSession.findUnique({ where });
  if (!session || !session.session)
    return res.status(400).json({ error: "❌ Telegram session not found" });

  const result = await sendMessageToMultiplePhones({
    sessionString: session.session,
    message,
    phoneNumbers: phonesArray,
    type,
    filePath: req.file?.path || null,
  });

  res.json({ result });
});
