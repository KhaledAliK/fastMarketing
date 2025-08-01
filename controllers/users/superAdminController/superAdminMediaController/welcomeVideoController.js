const asyncHandler = require("express-async-handler");
const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadingVideo,
  cloudinaryDeletingVideo,
} = require("../../../../utils/cloudinaryVideo");

/**
 * @method POST
 * @route ~api/super-admin/upload-welcome-video
 * @desc Upload Welcome Video (Only Super Admin)
 */
module.exports.uploadWelcomeVideoCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, message: "No video provided" });
  }

  const videoPath = path.join(
    __dirname,
    `../../../../videos/${req.file.filename}`
  );
  const result = await cloudinaryUploadingVideo(videoPath);

  const wVideo = await prisma.welcomeVideo.create({
    data: {
      videoUrl: result.secure_url,
      publicId: result.public_id,
    },
  });

  fs.unlinkSync(videoPath);
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Video uploaded successfully",
    wVideo,
  });
});

/**
 * @method DELETE
 * @route ~/api/super-admin/delete-welcome-video/:id
 * @desc Delete Welcome Video (Only Admin)
 */
module.exports.deleteWelcomeVideoCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const wVideo = await prisma.welcomeVideo.findUnique({ where: { id } });

  if (!wVideo) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Welcome video not found",
    });
  }

  await cloudinaryDeletingVideo(wVideo.publicId);
  await prisma.welcomeVideo.delete({ where: { id } });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Welcome video deleted successfully",
  });
});

/**
 * @method GET
 * @route ~/api/super-admin/get-welcome-video
 * @desc Get Welcome Video
 */
module.exports.getWelcomeVideoCtrl = asyncHandler(async (req, res) => {
  const wVideo = await prisma.welcomeVideo.findFirst();

  if (!wVideo) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Welcome video not found",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: wVideo });
});
