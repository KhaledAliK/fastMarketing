const {
  uploadVideoCtrl,
  updateVideoCtrl,
  deleteVideoCtrl,
  getVideoCtrl,
  getAllVideosCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/videoController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../../middlewares/authMiddleware");
const uploadVideo = require("../../../middlewares/videoUploading");

const router = require("express").Router();

router.post(
  "/upload-video",
  verifySuperAdmin,
  uploadVideo.single("video"),
  uploadVideoCtrl
);

router.put(
  "/update-video/:id",
  verifySuperAdmin,
  uploadVideo.single("video"),
  updateVideoCtrl
);

router.delete("/delete-video/:id", verifySuperAdmin, deleteVideoCtrl);
router.get("/get-video/:id", authenticateUser, getVideoCtrl);
router.get("/get-videos", authenticateUser, getAllVideosCtrl);

module.exports = router;
