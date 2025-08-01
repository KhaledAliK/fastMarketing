const {
  sendTextNotificationCtrl,
  sendMediaNotificationCtrl,
  getNotificationForUserCtrl,
  deleteUserNotificationCtrl,
  deleteAllUserNotificationsCtrl,
} = require("../../controllers/userNotification/userNotficationController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../middlewares/authMiddleware");
const uploadMedia = require("../../middlewares/mediaMiddleware");

const router = require("express").Router();

router.post(
  "/send-user-notification",
  verifySuperAdmin,
  sendTextNotificationCtrl
);

router.post("/send-media-notification", uploadMedia, sendMediaNotificationCtrl);
router.get("/get-user-notifications/:userId", getNotificationForUserCtrl);
router.delete(
  "/delete-user-notification/:userId/:notificationId",
  authenticateUser,
  deleteUserNotificationCtrl
);
router.delete(
  "/delete-all-user-notifications/:userId",
  authenticateUser,
  deleteAllUserNotificationsCtrl
);
module.exports = router;
