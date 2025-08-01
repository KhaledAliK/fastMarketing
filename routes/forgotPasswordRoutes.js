const {
  forgotPassword,
  resetPasswordForm,
  resetPassword,
} = require("../controllers/users/forgotPasswordController");

const router = require("express").Router();
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:userId/:token", resetPasswordForm);
router.post("/reset-password/:userId/:token", resetPassword);

module.exports = router;
