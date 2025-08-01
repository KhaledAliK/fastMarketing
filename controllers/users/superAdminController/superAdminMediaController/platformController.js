const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const httpStatusText = require("../../../../utils/httpStatusText");
const prisma = require("../../../../config/prisma");
const {
  platformSchema,
  updatePlatformSchema,
} = require("../../../../utils/platformValidation");
const {
  cloudinaryUploadingImageBanner,
  cloudinaryDeletingImageBanner,
} = require("../../../../utils/cloudinaryBanner");

/**
 * @method POST
 * @route ~api/super-admin/create-platform
 * @desc Create Platform (Only Super Admin)
 */
module.exports.createPlatformCtrl = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const validation = platformSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  if (!req.files || !req.files.platformUrl || !req.files.logoUrl) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Both platformUrl and logoUrl images are required",
    });
  }

  const platformUrlPath = path.join(
    __dirname,
    `../../../../images/${req.files.platformUrl[0].filename}`
  );
  const logoUrlPath = path.join(
    __dirname,
    `../../../../images/${req.files.logoUrl[0].filename}`
  );

  const platformUrlResult = await cloudinaryUploadingImageBanner(
    platformUrlPath
  );
  const logoUrlResult = await cloudinaryUploadingImageBanner(logoUrlPath);

  const platform = await prisma.platform.create({
    data: {
      name,
      platformUrl: platformUrlResult.secure_url,
      publicId: platformUrlResult.public_id,
      logoUrl: logoUrlResult.secure_url,
      logoPublicId: logoUrlResult.public_id,
    },
  });

  fs.unlinkSync(platformUrlPath);
  fs.unlinkSync(logoUrlPath);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Platform created successfully",
    platform,
  });
});

/**
 * @method PUT
 * @route ~api/super-admin/update-platform/:id
 * @desc Update Platform (Only Super Admin)
 */
module.exports.updatePlatformCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  const validation = updatePlatformSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const platform = await prisma.platform.findUnique({ where: { id } });

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform not found" });
  }

  let updatedData = { name, status };

  if (req.file) {
    const imagePath = path.join(
      __dirname,
      `../../../../images/${req.files.platformUrl[0].filename}`
    );
    const result = await cloudinaryUploadingImageBanner(imagePath);
    await cloudinaryDeletingImageBanner(platform.publicId);
    updatedData.platformUrl = result.secure_url;
    updatedData.publicId = result.public_id;
    fs.unlinkSync(imagePath);
  }

  const updatedPlatform = await prisma.platform.update({
    where: { id },
    data: updatedData,
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Platform updated successfully",
    updatedPlatform,
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get-platform/:id
 * @desc Get Single Platform (Only Super Admin)
 */
module.exports.getSinglePlatformCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const locale = req.headers.locale || "en";

  const selectedLangauge = locale.toLowerCase() === "ar" ? "AR" : "EN";
  const platform = await prisma.platform.findUnique({
    where: {
      id,
    },
    include: {
      video: {
        where: { language: selectedLangauge },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!platform) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message:
        selectedLanguage === "AR" ? "المنصة غير موجودة" : "Platform not found",
    });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: platform });
});

/**
 * @method GET
 * @route ~api/super-admin/get-all-platforms
 * @desc Get All Platforms (Only Super Admin)
 */
module.exports.getAllPlatformsCtrl = asyncHandler(async (req, res) => {
  const platform = await prisma.platform.findMany();
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: platform.length === 0 ? "There are no platforms" : platform,
  });
});

/**
 * @method PATCH
 * @route ~api/super-admin/toggle-status-platform/:id
 * @desc Toggle Status Platform (Only Super Admin)
 */
module.exports.togglePlatformStatusCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const platform = await prisma.platform.findUnique({ where: { id } });

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform not found" });
  }

  const updatedPlatform = await prisma.platform.update({
    where: { id },
    data: { status: !platform.status },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: `Platform is now ${updatedPlatform.status ? "Active" : "Paused"}`,
    updatedPlatform,
  });
});

/**
 * @method DELETE
 * @route ~api/super-admin/delete-platform/:id
 * @desc Delete Platform (Only Super Admin)
 */
module.exports.deletePlatformCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const platform = await prisma.platform.findUnique({ where: { id } });

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform not found" });
  }

  await prisma.platform.delete({ where: { id } });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Platform deleted successfully",
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get-platform
 * @desc Get Platform (Only Super Admin)
 */
module.exports.getPlatformByNameCtrl = asyncHandler(async (req, res) => {
  const platforms = await prisma.platform.findMany({
    where: {
      name: {
        in: ["Whatsapp", "Telegram"],
      },
    },
  });

  if (!platforms || platforms.length === 0) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "No platforms found",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, platforms });
});
