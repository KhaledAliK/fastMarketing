const express = require("express");

const router = express.Router();

router.use("/user", require("./superAdminRoutes/authSuperAdminRoutes"));
router.use(
  "/user",
  require("./superAdminRoutes/accountManagementSuperAdminRoutes")
);
router.use("/user", require("./regularUserRoutes/authRegularUserRoutes"));
router.use("/user", require("./userRoutes"));

router.use(
  "/super-admin",
  require("./superAdminRoutes/subscriptionPackageRoutes")
);
router.use(
  "/super-admin",
  require("./superAdminRoutes/supervisorManagementRoutes")
);
router.use(
  "/super-admin",
  require("./superAdminRoutes/superAdminMediaRoutes/bannerRoutes")
);
router.use(
  "/super-admin",
  require("./superAdminRoutes/superAdminMediaRoutes/videoRoutes")
);
router.use(
  "/super-admin",
  require("../routes/superAdminRoutes/superAdminMediaRoutes/accountRoutes")
);
router.use(
  "/super-admin",
  require("../routes/superAdminRoutes/superAdminMediaRoutes/platformRoutes")
);
router.use(
  "/super-admin",
  require("../routes/superAdminRoutes/superAdminMediaRoutes/welcomeVideoRoutes")
);
router.use(
  "/super-admin",
  require("../routes/superAdminRoutes/superAdminMediaRoutes/policyRoutes")
);
router.use(
  "/super-admin",
  require("./superAdminRoutes/superAdminMediaRoutes/discountCodeRoutes")
);
router.use("/supervisor", require("./superAdminRoutes/salesManagementRoutes"));
router.use("/auth", require("./forgotPasswordRoutes"));

// ========================Platforms===========================
router.use("/platform", require("./platforms/whatsappBaileys"));
router.use("/platform", require("./platforms/telegramRoutes"));
router.use("/platform", require("./platforms/telegramChannelRoutes"))

// ========================Diamond Wallet===========================
router.use("/wallet", require("./diamondWallet/diamondWalletRoutes"));

// ============================User Subscription=================================
router.use(
  "/user-subscription",
  require("./userSubscriptionRoutes/userSubscriptionRoutes")
);

// ============================User Notification=================================
router.use(
  "/notification",
  require("./userNotification/userNotificationRoutes")
);

// ============================Share Rewards=================================
router.use("/share-rewards", require("./shareReward/shareRewardRoutes"));

// ============================Technical Chat Messages=================================
router.use("/chat-messages", require("./chatMessages/chatMessagesRoute"));

// ============================Group=================================
router.use("/groups", require("./group/groupRoutes"));

// ============================Group=================================
router.use(
  "/platform",
  require("./superAdminRoutes/superAdminMediaRoutes/platformProposalRoutes")
);

// ============================Countries=================================
router.use("/country", require("./countries"));

module.exports = router;
