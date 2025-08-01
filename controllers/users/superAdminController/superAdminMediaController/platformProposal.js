const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const asyncHandler = require("express-async-handler");

/**
 * @method POST
 * @route ~api/platform/create-proposal/:platformId
 * @desc Make a suggestion by subscription user
 */
module.exports.createPlatformProposalCtrl = asyncHandler(async (req, res) => {
  const { platformId } = req.params;
  const userId = req.user?.id;
  const { proposal } = req.body;

  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform not found" });
  }

  const user = await prisma.regularUser.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "User not found",
    });
  }

  if (!proposal) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, message: "Proposal required" });
  }

  const newProposal = await prisma.platformProposal.create({
    data: {
      platformId,
      userId,
      proposal,
    },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Proposal created successfully",
    newProposal,
  });
});

/**
 * @method GET
 * @route ~api/platform/get-all-proposals
 * @desc Get all proposals by super admin
 */
module.exports.getAllProposalsCtrl = asyncHandler(async (req, res) => {
  const proposals = await prisma.platformProposal.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          profilePhoto: true,
        },
      },
      platform: {
        select: {
          id: true,
          name: true,
          platformUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!proposals) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not proposals",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, proposals });
});

/**
 * @method GET
 * @route ~api/platform/get-proposal/:proposalId
 * @desc Get single proposal by super admin
 */
module.exports.getSingleProposalCtrl = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await prisma.platformProposal.findUnique({
    where: { id: proposalId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          profilePhoto: true,
        },
      },
      platform: {
        select: {
          id: true,
          name: true,
          platformUrl: true,
        },
      },
    },
  });

  if (!proposal) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Proposal not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, proposal });
});

/**
 * @method DELETE
 * @route ~api/platform/delete-proposal/:proposalId
 * @desc Delete single proposal by super admin
 */
module.exports.deleteProposalCtrl = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await prisma.platformProposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Proposal not found" });
  }

  const deletedProposal = await prisma.platformProposal.delete({
    where: { id: proposalId },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Proposal deleted successfully",
    deletedProposal,
  });
});
