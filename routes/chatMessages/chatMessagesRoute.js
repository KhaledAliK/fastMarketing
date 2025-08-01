const router = require("express").Router();
const {
  getUserChatMessagesCtrl,
  getSuggestedUsersCtrl,
} = require("../../controllers/liveChat/chatMessages");
const {
  authenticateUser,
  verifySuperAdmin,
} = require("../../middlewares/authMiddleware");

router.get(
  "/get-messages/:senderId/:receiverId",
  authenticateUser,
  getUserChatMessagesCtrl
);

router.get(
  "/get-suggested-users/:adminId",
  // verifySuperAdmin,
  getSuggestedUsersCtrl
);

module.exports = router;
