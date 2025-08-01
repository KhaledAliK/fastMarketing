const {
  uploadProfilePhotoCtrl,
} = require("../../controllers/uploadProfilePhotoController");
const {
  getSuperAdminProfileCtrl,
  updateSuperAdminProfileCtrl,
  deleteSuperAdminAccountCtrl,
  getNumberOfSuperAdminCtrl,
  getAllSuperAdminsCtrl,
} = require("../../controllers/users/superAdminController/accountManagementSuperAdminController");
const { verifySuperAdmin } = require("../../middlewares/authMiddleware");
const photoUploading = require("../../middlewares/photoUploading");

const router = require("express").Router();

router.get(
  "/super-admin/profile/:userId",
  verifySuperAdmin,
  getSuperAdminProfileCtrl
);
router.put(
  "/super-admin/update/:userId",
  verifySuperAdmin,
  updateSuperAdminProfileCtrl
);
router.delete(
  "/super-admin/delete/:userId",
  deleteSuperAdminAccountCtrl
);
router.post(
  "/super-admin/upload-profile-photo",
  verifySuperAdmin,
  photoUploading.single("image"),
  uploadProfilePhotoCtrl
);
router.get(
  "/super-admin/get-super-admin-count",
  verifySuperAdmin,
  getNumberOfSuperAdminCtrl
);
router.get(
  "/super-admin/get-all-super-admins",
  verifySuperAdmin,
  getAllSuperAdminsCtrl
);
router.post(
  "/super-admin/upload-profile-photo",
  verifySuperAdmin,
  photoUploading.single("image"),
  uploadProfilePhotoCtrl
);
module.exports = router;


