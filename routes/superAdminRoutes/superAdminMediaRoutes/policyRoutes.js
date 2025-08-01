const {
  createPolicyCtrl,
  getPolicyCtrl,
  updatePolicyCtrl,
  deletePolicyCtrl,
  getAllPolices,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/policyController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/create-policy", verifySuperAdmin, createPolicyCtrl);
router.get("/get-policy", authenticateUser, getPolicyCtrl);
router.put("/update-policy/:id", verifySuperAdmin, updatePolicyCtrl);
router.delete("/delete-policy/:id", verifySuperAdmin, deletePolicyCtrl);
router.get("/get-all-polices", authenticateUser, getAllPolices)

module.exports = router;
