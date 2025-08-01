const router = require("express").Router();
const {
  uploadWelcomeVideoCtrl,
  deleteWelcomeVideoCtrl,
  getWelcomeVideoCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/welcomeVideoController");
const { verifySuperAdmin, authenticateUser } = require("../../../middlewares/authMiddleware");
const uploadVideo = require("../../../middlewares/videoUploading");

router.post(
  "/upload-welcome-video",
  verifySuperAdmin,
  uploadVideo.single("video"),
  uploadWelcomeVideoCtrl
);
router.delete(
  "/delete-welcome-video/:id",
  verifySuperAdmin,
  deleteWelcomeVideoCtrl
);
router.get("/get-welcome-video", authenticateUser, getWelcomeVideoCtrl);

module.exports = router;


