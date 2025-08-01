const {
  uploadProfilePhotoCtrl,
} = require("../../controllers/uploadProfilePhotoController");
const {
  createSalesCtrl,
  loginSalesCtrl,
  updateSalesCtrl,
  requestEmailUpdateCtrl,
  verifyEmailUpdateCtrl,
  getSalesProfileCtrl,
  getAllSalesCtrl,
  deleteSalesCtrl,
  updateSalesProfileImageCtrl,
  updateSalesPhoneCtrl,
} = require("../../controllers/users/superAdminController/salesManagementController");
const {
  protectAndAuthorizeSales,
  authenticateUser,
  protectAndAuthorizeUserAccount,
} = require("../../middlewares/authMiddleware");
const photoUploading = require("../../middlewares/photoUploading");

const router = require("express").Router();

router.post(
  "/create/sales",
  protectAndAuthorizeSales,
  photoUploading.single("profilePhoto"),
  createSalesCtrl
);
router.post("/login/sales", loginSalesCtrl);
router.put("/update/sales/:salesId", protectAndAuthorizeSales, updateSalesCtrl);
router.put("/request-email-update/:salesId", authenticateUser, requestEmailUpdateCtrl);
router.get("/verify-email/:token", verifyEmailUpdateCtrl);
router.put("/update/sales/phone/:id", authenticateUser, updateSalesPhoneCtrl);
router.get(
  "/get/sales/:id",
  protectAndAuthorizeUserAccount,
  getSalesProfileCtrl
);
router.get("/get/all-sales", protectAndAuthorizeSales, getAllSalesCtrl);
router.delete("/delete/sales/:id", protectAndAuthorizeSales, deleteSalesCtrl);
router.post(
  "/upload-profile-photo/sales",
  authenticateUser,
  photoUploading.single("image"),
  uploadProfilePhotoCtrl
);
router.put(
  "/update/sales/profile-image/:id",
  authenticateUser,
  photoUploading.single("profilePhoto"),
  updateSalesProfileImageCtrl
);
module.exports = router;
