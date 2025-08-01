const router = require("express").Router();

const {
  createPlatformCtrl,
  updatePlatformCtrl,
  getSinglePlatformCtrl,
  getAllPlatformsCtrl,
  togglePlatformStatusCtrl,
  deletePlatformCtrl,
  getPlatformByNameCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/platformController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../../middlewares/authMiddleware");
const photoUploading = require("../../../middlewares/photoUploading");

router.post(
  "/create-platform",
  // verifySuperAdmin,
  photoUploading.fields([
    { name: "platformUrl", maxCount: 1 },
    { name: "logoUrl", maxCount: 1 },
  ]),
  createPlatformCtrl
);
router.put(
  "/update-platform/:id",
  // verifySuperAdmin,
  photoUploading.fields([
    { name: "platformUrl", maxCount: 1 },
    { name: "logoUrl", maxCount: 1 },
  ]),
  updatePlatformCtrl
);
router.get("/get-platform/:id", authenticateUser, getSinglePlatformCtrl);
router.get("/get-all-platforms", authenticateUser, getAllPlatformsCtrl);
router.patch(
  "/toggle-status-platform/:id",
  verifySuperAdmin,
  togglePlatformStatusCtrl
);
router.delete("/delete-platform/:id", verifySuperAdmin, deletePlatformCtrl);
router.get("/get-platform", verifySuperAdmin, getPlatformByNameCtrl);

module.exports = router;
