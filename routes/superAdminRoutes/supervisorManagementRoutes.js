const router = require("express").Router();
const {
  uploadProfilePhotoCtrl,
} = require("../../controllers/uploadProfilePhotoController");
const {
  createSupervisorCtrl,
  loginSupervisorCtrl,
  updateSupervisorCtrl,
  deleteSupervisorCtrl,
  getAllSupervisorsCtrl,
  getSupervisorAccountCtrl,
  requestEmailUpdateCtrl,
  verifyEmailUpdateCtrl,
  getSalesForSupervisorCtrl,
} = require("../../controllers/users/superAdminController/supervisorManagementController");
const {
  verifySuperAdmin,
  verifySuperAdminOrSelf,
  authenticateUser,
} = require("../../middlewares/authMiddleware");
const photoUploading = require("../../middlewares/photoUploading");

router.post(
  "/create/supervisor",
  verifySuperAdmin,
  photoUploading.single("profilePhoto"),
  createSupervisorCtrl
);
router.post("/login/supervisor", loginSupervisorCtrl);
router.put(
  "/update/supervisor/:id",
  verifySuperAdminOrSelf,
  updateSupervisorCtrl
);
router.delete(
  "/delete/supervisor/:id",
  verifySuperAdminOrSelf,
  deleteSupervisorCtrl
);
router.get(
  "/get-supervisor/:id",
  verifySuperAdminOrSelf,
  getSupervisorAccountCtrl
);
router.get("/get/all-supervisors", verifySuperAdmin, getAllSupervisorsCtrl);
router.post(
  "/upload-profile-photo/:id",
  verifySuperAdminOrSelf,
  photoUploading.single("profilePhoto"),
  uploadProfilePhotoCtrl
);
router.get("/get-supervisor/:id/sales", authenticateUser, getSalesForSupervisorCtrl)

module.exports = router;
