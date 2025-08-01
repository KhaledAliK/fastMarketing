const router = require("express").Router();
const {
  createSubscriptionPackageCtrl,
  updateSubscriptionPackageCtrl,
  deleteSubscriptionPackageCtrl,
  getAllSubscriptionPackage,
  getSingleSubscriptionPackage,
} = require("../../controllers/users/superAdminController/subscriptionPackageController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../middlewares/authMiddleware");

router.post(
  "/subscription-package/create",
  verifySuperAdmin,
  createSubscriptionPackageCtrl
);
router.get(
  "/subscription-package/get-all-packages",
  authenticateUser,
  getAllSubscriptionPackage
);
router.get(
  "/subscription-package/get-package/:id",
  authenticateUser,
  getSingleSubscriptionPackage
);
router.put(
  "/subscription-package/update-package/:id",
  verifySuperAdmin,
  updateSubscriptionPackageCtrl
);
router.delete(
  "/subscription-package/delete-package/:id",
  verifySuperAdmin,
  deleteSubscriptionPackageCtrl
);
module.exports = router;
