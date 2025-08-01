const {
  uploadBannerCtrl,
  updateBannerCtrl,
  deleteBannerCtrl,
  getSingleBannerCtrl,
  getAllBannersCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/bannerController");
const { verifySuperAdmin } = require("../../../middlewares/authMiddleware");
const photoUploading = require("../../../middlewares/photoUploading");

const router = require("express").Router();
router.post(
  "/upload/banner-photo",
  verifySuperAdmin,
  photoUploading.single("image"),
  uploadBannerCtrl
);
router.put(
  "/upload/banner-photo/:id",
  verifySuperAdmin,
  photoUploading.single("image"),
  updateBannerCtrl
);
router.delete(
  "/delete/banner-photo/:id",
  verifySuperAdmin,
  photoUploading.single("image"),
  deleteBannerCtrl
);
router.get("/get-banner-photo/:id", verifySuperAdmin, getSingleBannerCtrl);
router.get("/get-banners", verifySuperAdmin, getAllBannersCtrl);
module.exports = router;
