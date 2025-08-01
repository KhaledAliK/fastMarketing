const router = require("express").Router();
const {
  createAccountCtrl,
  updateAccountCtrl,
  getSingleAccountCtrl,
  getAllAccountsCtrl,
  deleteAccountCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/accountController");
const { verifySuperAdmin } = require("../../../middlewares/authMiddleware");

router.post("/create-account", verifySuperAdmin, createAccountCtrl);
router.put("/update-account/:id", verifySuperAdmin, updateAccountCtrl);
router.get("/get-account/:id", verifySuperAdmin, getSingleAccountCtrl);
router.get("/get-all-accounts", verifySuperAdmin, getAllAccountsCtrl);
router.delete("/delete-account/:id", verifySuperAdmin, deleteAccountCtrl);

module.exports = router;
