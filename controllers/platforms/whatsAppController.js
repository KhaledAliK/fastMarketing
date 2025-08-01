const prisma = require("../../config/prisma");
const asyncHandler = require("express-async-handler");
const { getSock } = require("../../platforms/whatsapp-baileys/whatsapp");

/**
 * @method POST
 * @desc Add user group to WhatsApp platform
 */
module.exports.addGroupCtrl = asyncHandler(async (req, res) => {
  const { name, link, countryId } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!name || !link || !countryId) {
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });
  }

  const country = await prisma.country.findUnique({ where: { id: countryId } });

  if (!country) {
    return res
      .status(404)
      .json({ success: false, message: "❌ Country not found" });
  }

  const platform = await prisma.platform.findUnique({
    where: { name: "Whatsapp" },
  });

  if (!platform) {
    return res
      .status(404)
      .json({ success: false, message: "❌ Platform Whatsapp not found" });
  }

  const existing = await prisma.platformGroupRequest.findUnique({
    where: { link },
  });

  if (existing) {
    return res
      .status(409)
      .json({ message: "❌ This link was requested before" });
  }

  const requestData = {
    name,
    link,
    platform: {
      connect: { id: platform.id },
    },
    country: {
      connect: { id: countryId },
    },
  };

  if (userRole === "REGULAR_USER") {
    requestData.user = {
      connect: { id: userId },
    };
  } else if (userRole === "SUPER_ADMIN") {
    requestData.superAdmin = {
      connect: { id: userId },
    };
  }

  const newRequest = await prisma.platformGroupRequest.create({
    data: requestData,
  });

  return res.status(201).json({
    message: "✅ The request was sent successfully",
    data: newRequest,
  });
});

/**
 * @method GET
 * @desc Get user request to adding his group
 */
module.exports.getAllGroupRequestsCtrl = asyncHandler(async (req, res) => {
  const requests = await prisma.platformGroupRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      country: true,
      platform: true,
      user: true,
      superAdmin: true,
    },
  });

  return res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

/**
 * @method PATCH
 * @desc Accept the adding groups
 */
module.exports.acceptAddUserGroupCtrl = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await prisma.platformGroupRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return res
      .status(404)
      .json({ success: false, message: "❌ Request not found" });
  }

  const match = request.link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
  const inviteCode = match ? match[1] : null;

  if (!inviteCode) {
    return res
      .status(400)
      .json({ success: false, message: "❌ WhatsApp link not valid" });
  }

  const sock = getSock();
  let whatsappJid;
  try {
    whatsappJid = await sock.groupAcceptInvite(inviteCode);
    console.log("✅ Joined to whatsApp group", whatsappJid);
  } catch (err) {
    console.error("❌ Failed to join to whatsApp group", err);
    return res.status(500).json({
      success: false,
      message: "❌ Failed to join to whatsApp group",
      error: err?.message || err,
    });
  }

  await prisma.platformGroup.create({
    data: {
      name: request.name,
      link: request.link,
      whatsappJid,
      imageUrl: null,
      telegramId: null,
      accessHash: null,
      countryId: request.countryId,
      platformId: request.platformId,
      userId: request.userId,
      superAdminId: request.superAdminId,
    },
  });

  await prisma.platformGroupRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  return res.status(200).json({
    success: true,
    message: "✅ Request accepted and joined to group successfully",
  });
});

/**
 * @method PATCH
 * @desc Reject the adding groups
 */
module.exports.rejectAddUserGroupCtrl = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await prisma.platformGroupRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });
  }

  if (request.status === "REJECTED") {
    return res
      .status(400)
      .json({ success: "This request was rejected before" });
  }

  const updatedRequest = await prisma.platformGroupRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Request has been rejected",
    updatedRequest,
  });
});

/**
 * @method GET
 * @desc Get all pending requests
 */
module.exports.getPendingRequestsCtrl = asyncHandler(async (req, res) => {
  const pendingRequests = await prisma.platformGroupRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: true,
      superAdmin: true,
      country: true,
      platform: true,
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
 * @desc Get phone numbers grouped by country with count
 */
module.exports.getPhoneNumbersByCountryCtrl = asyncHandler(async (req, res) => {
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

  const sock = await getSock();

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
      const result = await sock.onWhatsApp(number);
      if (result && result.length > 0 && result[0]?.exists) {
        grouped[key].validNumbers.push(number);
      } else {
        grouped[key].invalidNumbers.push(number);
      }
    } catch (error) {
      console.error(`❌ Error checking number ${number}:`, error.message);
      grouped[key].invalidNumbers.push(number);
    }
  }

  const groupedResult = Object.values(grouped).map((group) => ({
    nameEn: group.nameEn,
    nameAr: group.nameAr,
    flagUrl: group.flagUrl,
    total: group.validNumbers.length + group.invalidNumbers.length,
    whatsappAccounts: group.validNumbers.length,
    noWhatsappAccounts: group.invalidNumbers.length,
    validNumbers: group.validNumbers,
    invalidNumbers: group.invalidNumbers,
  }));

  return res.status(200).json({
    success: true,
    totalCountries: groupedResult.length,
    details: groupedResult,
  });
});

