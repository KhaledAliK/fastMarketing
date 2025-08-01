const {
  getUserAccount,
  updateUser,
  deleteUser,
} = require("../controllers/users/userController");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = require("express").Router();
router.get("/:userId", authenticateUser, getUserAccount);
router.patch("/update/:userId", authenticateUser, updateUser);
router.delete("/delete/:userId", authenticateUser, deleteUser);

module.exports = router;
