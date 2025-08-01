const router = require("express").Router();
const {
  createShareRewardCtrl,
  updateShareRewardCtrl,
  getSingleSharingRewardCtrl,
  getAllSharingRewardsCtrl,
  deleteSharingRewardCtrl,
  shareAppCtrl,
} = require("../../controllers/shareReward/shareRewardController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/sharedRewardMiddleware");

router.post(
  "/create-reward",
  verifySuperAdmin,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "videoUrl", maxCount: 1 },
    { name: "logoUrl", maxCount: 1 },
  ]),
  createShareRewardCtrl
);
router.put(
  "/update-reward/:id",
  verifySuperAdmin,
  upload.fields([
    { name: "imageUrl", maxCount: 1 },
    { name: "videoUrl", maxCount: 1 },
    { name: "logoUrl", maxCount: 1 },
  ]),
  updateShareRewardCtrl
);
router.get("/get-reward/:id", authenticateUser, getSingleSharingRewardCtrl);
router.get("/get-rewards", authenticateUser, getAllSharingRewardsCtrl);
router.delete("/delete-reward/:id", verifySuperAdmin, deleteSharingRewardCtrl);
router.post("/share-app/:rewardId", authenticateUser, shareAppCtrl);
module.exports = router;
