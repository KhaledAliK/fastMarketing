const router = require("express").Router();
const {
  createGroupCtrl,
  getSingleGroupCtrl,
  getAllGroupsCtrl,
  deleteGroupCtrl,
} = require("../../controllers/groups/groupsController");
const { verifySuperAdmin } = require("../../middlewares/authMiddleware");
const photoUploading = require("../../middlewares/photoUploading");

router.post(
  "/create-group/:platformId",
  verifySuperAdmin,
  photoUploading.single("countryFlag"),
  createGroupCtrl
);
router.get("/get-single-group/:groupId", verifySuperAdmin, getSingleGroupCtrl);
router.get("/get-all-groups", verifySuperAdmin, getAllGroupsCtrl);
router.delete("/delete-group/:groupId", verifySuperAdmin, deleteGroupCtrl);

module.exports = router;
