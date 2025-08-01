const router = require("express").Router();
const {
  createUserSubscriptionCtrl,
  getSubscriptionsStatisticsCtrl,
  getEarningsStatisticsCtrl,
} = require("../../controllers/users/userSubscriptionController/userSubscriptionController");
const { verifySuperAdmin } = require("../../middlewares/authMiddleware");

router.post("/create", createUserSubscriptionCtrl);
router.get(
  "/get-subscriptions-statistics",
  verifySuperAdmin,
  getSubscriptionsStatisticsCtrl
);
router.get("/earnings-statistics", verifySuperAdmin, getEarningsStatisticsCtrl);

module.exports = router;
