const router = require("express").Router();
const {
  registerSuperAdminCtrl,
  loginSuperAdminCtrl,
  verifyEmail,
  // resendVerificationEmail,
  // forgotPassword,
  // resetPassword,
  // resetPasswordForm,
} = require("../../controllers/users/superAdminController/authSuperAdminController");
const photoUploading = require("../../middlewares/photoUploading");

router.post("/super-admin/register", photoUploading.single("profilePhoto"), registerSuperAdminCtrl);
router.post("/super-admin/login", loginSuperAdminCtrl);
router.get("/verify/:userId/:token", verifyEmail);
// router.post("/resend-verification", resendVerificationEmail);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:userId/:token", resetPassword);
// router.get("/reset-password/:userId/:token", resetPasswordForm);
module.exports = router;

