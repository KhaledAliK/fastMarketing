const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const {
  cloudinaryUploadingVideo,
  cloudinaryDeletingVideo,
} = require("../../../../utils/cloudinaryVideo");

/**
 * @method POST
 * @route ~api/super-admin/upload-video
 * @desc Upload Video (Only Super Admin)
 */
module.exports.uploadVideoCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  const { platformId, title, description, language } = req.body;
  if (!superAdminId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No video file provided",
    });
  }

  if (!platformId) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Platform ID is required",
    });
  }

  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform not found" });
  }

  const videoPath = path.join(
    __dirname,
    `../../../../videos/${req.file.filename}`
  );
  const result = await cloudinaryUploadingVideo(videoPath);

  const video = await prisma.video.create({
    data: {
      videoUrl: result.secure_url,
      publicId: result.public_id,
      superAdminId,
      platformId,
      title,
      description,
      language: language?.toUpperCase() || undefined,
    },
  });

  fs.unlinkSync(videoPath);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Video uploaded successfully.",
    video,
  });
});

/**
 * @method PUT
 * @route ~api/super-admin/update-video/:id
 * @desc Update Video (Only Super Admin)
 */
module.exports.updateVideoCtrl = asyncHandler(async (req, res) => {
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
      message: "Only Super Admin can update videos.",
    });
  }

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Video not found" });
  }

  if (!req.file) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No new video file provided.",
    });
  }

  const videoPath = path.join(
    __dirname,
    `../../../../videos/${req.file.filename}`
  );
  const result = await cloudinaryUploadingVideo(videoPath);

  if (video.publicId) {
    await cloudinaryDeletingVideo(video.publicId);
  }

  const updateVideo = await prisma.video.update({
    where: { id },
    data: {
      videoUrl: result.secure_url,
      publicId: result.public_id,
    },
  });

  fs.unlinkSync(videoPath);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Video updated successfully.",
    updateVideo,
  });
});

/**
 * @method DELETE
 * @route ~api/super-admin/delete-video/:id
 * @desc Delete Video (Only Super Admin)
 */
module.exports.deleteVideoCtrl = asyncHandler(async (req, res) => {
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
      message: "Only super admin can delete the video",
    });
  }

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Video not found" });
  }

  if (video.publicId) {
    await cloudinaryDeletingVideo(video.publicId);
  }

  await prisma.video.delete({ where: { id } });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Video deleted successfully",
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get-video/:id
 * @desc Get Video (Only Super Admin)
 */
module.exports.getVideoCtrl = asyncHandler(async (req, res) => {
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
      message: "Only super admin can get video",
    });
  }

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Video not fond" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: video });
});

/**
 * @method GET
 * @route ~api/super-admin/get-videos
 * @desc Get Videos (Only Super Admin)
 */
module.exports.getAllVideosCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;

  if (!superAdminId) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Unauthorized: User not authenticated",
    });
  }

  const video = await prisma.video.findMany();

  if (!video) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Video not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: video });
});
