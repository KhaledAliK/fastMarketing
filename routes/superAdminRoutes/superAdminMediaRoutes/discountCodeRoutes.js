const router = require("express").Router();
const {
  createDiscountCodeCtrl,
  updateDiscountCodeCtrl,
  getSingleDiscountCodeCtrl,
  getAllDiscountCodesCtrl,
  getDiscountCodesCountCtrl,
  deleteDiscountCodeCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/discountCodeController");
const {
  verifySuperAdmin,
  authenticateUser,
} = require("../../../middlewares/authMiddleware");

router.post("/create-discount-code", verifySuperAdmin, createDiscountCodeCtrl);
router.put(
  "/update-discount-code/:id",
  verifySuperAdmin,
  updateDiscountCodeCtrl
);
router.get(
  "/get-discount-code/:id",
  authenticateUser,
  getSingleDiscountCodeCtrl
);
router.get("/get-all-discount-code", verifySuperAdmin, getAllDiscountCodesCtrl);
router.get(
  "/get-discount-code-count",
  verifySuperAdmin,
  getDiscountCodesCountCtrl
);
router.delete(
  "/delete-discount-code/:id",
  verifySuperAdmin,
  deleteDiscountCodeCtrl
);
module.exports = router;

