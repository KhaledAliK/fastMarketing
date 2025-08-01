const router = require("express").Router();

const {
  createDiamondWalletCtrl,
  updateDiamondWalletCtrl,
  getSingleDiamondWalletCtrl,
  getAllDiamondWalletCtrl,
  deleteDiamondWalletCtrl,
} = require("../../controllers/diamondWallet/diamondWalletController");
const {
  subscribeToDiamondWalletCtrl,
  consumeRegularUserDiamondWalletCtrl,
  consumeSubscriptionUserDiamondWalletCtrl,
} = require("../../controllers/diamondWallet/subscriptionsContoller");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../middlewares/authMiddleware");

router.post("/create", verifySuperAdmin, createDiamondWalletCtrl);
router.put("/update/:id", verifySuperAdmin, updateDiamondWalletCtrl);
router.get("/get/:id", authenticateUser, getSingleDiamondWalletCtrl);
router.get("/get", authenticateUser, getAllDiamondWalletCtrl);
router.delete("/delete/:id", authenticateUser, deleteDiamondWalletCtrl);

// ==============================SubscriptionsWalletRoute==========================================================
router.post(
  "/subscribe/regular-user/:walletId",
  authenticateUser,
  subscribeToDiamondWalletCtrl
);
router.post(
  "/consume-diamond/regular-user/:userId",
  authenticateUser,
  consumeRegularUserDiamondWalletCtrl
);
router.post(
  "/consume-diamond/subscriber-user/:userId",
  authenticateUser,
  consumeSubscriptionUserDiamondWalletCtrl
);

module.exports = router;
