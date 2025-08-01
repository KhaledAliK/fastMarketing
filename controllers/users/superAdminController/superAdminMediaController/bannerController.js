const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const {
  cloudinaryUploadingImageBanner,
  cloudinaryDeletingImageBanner,
} = require("../../../../utils/cloudinaryBanner");

/**
 * @method POST
 * @route ~/api/super-admin/upload/banner-photo
 * @desc Upload banner (Only Super-Admin can do this action)
 */
module.exports.uploadBannerCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  if (!superAdminId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Only Super Admin can upload banners.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No file provided",
    });
  }

  const imagePath = path.join(
    __dirname,
    `../../../../images/${req.file.filename}`
  );

  if (!fs.existsSync(imagePath)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "File not found",
    });
  }

  let result;

  try {
    result = await cloudinaryUploadingImageBanner(imagePath);
  } catch (error) {
    return res.status(500).json({
      status: httpStatusText.FAIL,
      message: "Error uploading image to Cloudinary",
      error: error.message,
    });
  }

  if (!result || !result.secure_url || !result.public_id) {
    return res.status(500).json({
      status: httpStatusText.FAIL,
      message: "Cloudinary upload failed, missing secure_url or public_id",
    });
  }

  const banner = await prisma.banner.create({
    data: {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      superAdminId,
    },
  });

  fs.unlinkSync(imagePath);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Banner uploaded successfully.",
    banner,
  });
});

/**
 * @method PUT
 * @route ~/api/super-admin/upload/banner-photo/:id
 * @desc Update banner (Only Super-Admin can do this action)
 */
module.exports.updateBannerCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  const { id } = req.params;

  if (!superAdminId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Only Super Admin can update banners.",
    });
  }

  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Banner not found." });
  }

  if (!req.file) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No file provided.",
    });
  }

  const imagePath = path.join(
    __dirname,
    `../../../images/${req.file.filename}`
  );
  const result = await cloudinaryUploadingImageBanner(imagePath);

  await cloudinaryDeletingImageBanner(banner.publicId);

  const updatedBanner = await prisma.banner.update({
    where: { id },
    data: {
      imageUrl: result.secure_url,
      publicId: result.public_id,
    },
  });

  fs.unlinkSync(imagePath);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Banner updated successfully.",
    updatedBanner,
  });
});

/**
 * @method DELETE
 * @route ~/api/super-admin/delete/banner-photo/:id
 * @desc Delete banner (Only Super-Admin can do this action)
 */
module.exports.deleteBannerCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  const { id } = req.params;

  if (!superAdminId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Only Super Admin can delete banners.",
    });
  }

  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Banner not found.",
    });
  }

  const fileExtension = path.extname(new URL(banner.imageUrl).pathname);
  await cloudinaryDeletingImageBanner(banner.publicId);

  const imagePath = path.join(
    __dirname,
    `../../../images/${banner.publicId}${fileExtension}`
  );

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
  await prisma.banner.delete({ where: { id } });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Banner deleted successfully.",
  });
});

/**
 * @method GET
 * @route ~/api/super-admin/get-banner-photo/:id
 * @desc Get banner (Only Super-Admin can do this action)
 */
module.exports.getSingleBannerCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  const { id } = req.params;

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Banner not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: banner });
});

/**
 * @method GET
 * @route ~/api/super-admin/get-banners
 * @desc Get banners (Only Super-Admin can do this action)
 */
module.exports.getAllBannersCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: superAdminId },
  });

  if (!superAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const banner = await prisma.banner.findMany();

  if (!banner) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Banner not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: banner });
});
