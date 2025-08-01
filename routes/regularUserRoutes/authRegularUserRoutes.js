const {
  uploadProfilePhotoCtrl,
} = require("../../controllers/uploadProfilePhotoController");
const {
  registerRegularUserCtrl,
  loginRegularUserCtrl,
  updateRegularUserProfileCtrl,
  updateRegularUserEmailCtrl,
  verifyUpdatedEmailCtrl,
  getUserProfileCtrl,
  deleteUserProfileCtrl,
  getTheNumberOfUsersCtrl,
  getAllRegularUserCtrl,
  getAllUsersCtrl,
  getAllSubscribedUsersCtrl,
  getNonSubscribedUsersCtrl,
  getUsersProfileCtrl,
  updateUserProfileCtrl,
  updatePhoneNumberCtrl,
  changeUserPasswordCtrl,
} = require("../../controllers/users/regularUserController/authRegularUserController");
const {
  authenticateUser,
  verifySuperAdmin,
} = require("../../middlewares/authMiddleware");
const photoUploading = require("../../middlewares/photoUploading");

const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post(
  "/regular-user/register",
  photoUploading.single("profilePhoto"),
  registerRegularUserCtrl
);
router.post("/regular-user/login", loginRegularUserCtrl);
router.put(
  "/regular-user/update/:id",
  authenticateUser,
  photoUploading.single("profilePhoto"),
  updateRegularUserProfileCtrl
);
router.put(
  "/regular-user/change-password/:id",
  authenticateUser,
  changeUserPasswordCtrl,
);
router.put(
  "/regular-user/update-email/:id",
  authenticateUser,
  updateRegularUserEmailCtrl
);
router.get("/regular-user/verify-email/:token", verifyUpdatedEmailCtrl);
router.get(
  "/regular-user/get-profile/:id",
  authenticateUser,
  getUserProfileCtrl
);
router.get(
  "/regular-user/get-regular-user-count",
  verifySuperAdmin,
  getTheNumberOfUsersCtrl
);
router.delete(
  "/regular-user/delete-profile/:id",
  authenticateUser,
  deleteUserProfileCtrl
);
router.post(
  "/upload-profile-photo/regular-user/:id",
  authenticateUser,
  photoUploading.single("profilePhoto"),
  uploadProfilePhotoCtrl
);
router.get(
  "/regular-user/get-all-regular-users",
  verifySuperAdmin,
  getAllRegularUserCtrl
);
router.get(
  "/regular-user/get-all-subscribed-users",
  verifySuperAdmin,
  getAllSubscribedUsersCtrl
);
router.get(
  "/regular-user/non-subscribed",
  verifySuperAdmin,
  getNonSubscribedUsersCtrl
);
router.get("/regular-user/get-all-users", verifySuperAdmin, getAllUsersCtrl);
router.get("/profile/:id", authenticateUser, getUsersProfileCtrl);
router.put("/update-profile/:id", verifySuperAdmin, updateUserProfileCtrl);
router.put("/update-phone-number/:id", verifySuperAdmin, updatePhoneNumberCtrl);
module.exports = router;
