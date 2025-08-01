const router = require("express").Router();

const {
  createPlatformProposalCtrl,
  getAllProposalsCtrl,
  getSingleProposalCtrl,
  deleteProposalCtrl,
} = require("../../../controllers/users/superAdminController/superAdminMediaController/platformProposal");
const {
  authenticateUser,
  verifySuperAdmin,
} = require("../../../middlewares/authMiddleware");

router.post(
  "/create-proposal/:platformId",
  authenticateUser,
  createPlatformProposalCtrl
);
router.get("/get-all-proposals", verifySuperAdmin, getAllProposalsCtrl);
router.get(
  "/get-single-proposal/:proposalId",
  verifySuperAdmin,
  getSingleProposalCtrl
);
router.delete(
  "/delete-proposal/:proposalId",
  verifySuperAdmin,
  deleteProposalCtrl
);

module.exports = router;
