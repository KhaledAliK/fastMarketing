const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");
const httpStatusText = require("../../utils/httpStatusText");
const {
  cloudinaryUploadingImage,
  cloudinaryDeletingImage,
} = require("../../utils/cloudinary");
const {
  cloudinaryUploadingVideo,
  cloudinaryDeletingVideo,
} = require("../../utils/cloudinaryVideo");
const fs = require("fs");
const {
  createSharingRewardSchema,
} = require("../../utils/sharingRewardValidation");

/**
 * @method POST
 * @route ~api/share-rewards/create-reward
 * @description Create share reward (Only Super Admin)
 */
module.exports.createShareRewardCtrl = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    diamondReward,
    requiredShares,
    googleLink,
    appleLink,
  } = req.body;

  const validation = createSharingRewardSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        fields: err.path.join("."),
        message: err.message,
      })),
    });
  }
  
  let imageUrl = null;
  let videoUrl = null;
  let logoUrl = null;

  if (req.files?.imageUrl) {
    const imagePath = req.files.imageUrl[0].path;
    const result = await cloudinaryUploadingImage(imagePath);
    imageUrl = result.secure_url;
    fs.unlinkSync(imagePath);
  }

  if (req.files?.videoUrl) {
    const videoPath = req.files.videoUrl[0].path;
    const result = await cloudinaryUploadingVideo(videoPath);
    videoUrl = result.secure_url;
    fs.unlinkSync(videoPath);
  }

  if (req.files?.logoUrl) {
    const logoPath = req.files.logoUrl[0].path;
    const result = await cloudinaryUploadingImage(logoPath);
    logoUrl = result.secure_url;
    fs.unlinkSync(logoPath);
  }

  const reward = await prisma.shareReward.create({
    data: {
      title,
      description,
      diamondReward: Number(diamondReward),
      requiredShares: Number(requiredShares),
      googleLink,
      appleLink,
      imageUrl,
      videoUrl,
      logoUrl,
    },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Reward created successfully",
    reward,
  });
});

/**
 * @method PUT
 * @route ~api/share-rewards/update-reward/:id
 * @description Update share reward (Only Super Admin)
 */
module.exports.updateShareRewardCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    diamondReward,
    requiredShares,
    googleLink,
    appleLink,
  } = req.body;

  const reward = await prisma.shareReward.findUnique({ where: { id } });

  if (!reward) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Reward not found" });
  }

  let imageUrl = reward.imageUrl;
  let videoUrl = reward.videoUrl;
  let logoUrl = reward.logoUrl;

  if (req.files?.imageUrl) {
    if (imageUrl) {
      await cloudinaryDeletingImage(imageUrl);
    }
    const imagePath = req.files.imageUrl[0].path;
    const result = await cloudinaryUploadingImage(imagePath);
    imageUrl = result.secure_url;
    fs.unlinkSync(imagePath);
  }

  if (req.files?.videoUrl) {
    if (videoUrl) {
      await cloudinaryDeletingVideo(videoUrl);
    }
    const videoPath = req.files.videoUrl[0].path;
    const result = await cloudinaryUploadingVideo(videoPath);
    videoUrl = result.secure_url;
    fs.unlinkSync(videoPath);
  }

  if (req.files?.logoUrl) {
    if (logoUrl) {
      await cloudinaryDeletingImage(logoUrl);
    }
    const logoPath = req.files.logoUrl[0].path;
    const result = await cloudinaryUploadingImage(logoPath);
    logoUrl = result.secure_url;
    fs.unlinkSync(logoPath);
  }

  const updatedReward = await prisma.shareReward.update({
    where: { id },
    data: {
      title: title || reward.title,
      description: description || reward.description,
      diamondReward: diamondReward
        ? Number(diamondReward)
        : reward.diamondReward,
      requiredShares: requiredShares
        ? Number(requiredShares)
        : reward.requiredShares,
      googleLink: googleLink || reward.googleLink,
      appleLink: appleLink || reward.appleLink,
      imageUrl,
      videoUrl,
      logoUrl,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Reward updated successfully",
    updatedReward,
  });
});

/**
 * @method GET
 * @route ~api/share-rewards/get-reward/:id
 * @description Get share reward (Only logged in user)
 */
module.exports.getSingleSharingRewardCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reward = await prisma.shareReward.findUnique({ where: { id } });

  if (!reward) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Reward with this id not found",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, reward });
});

/**
 * @method GET
 * @route ~api/share-rewards/get-rewards
 * @description Get  all sharing reward (Only Super Admin)
 */
module.exports.getAllSharingRewardsCtrl = asyncHandler(async (req, res) => {
  const rewards = await prisma.shareReward.findMany();

  if (!rewards) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There are not rewards" });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: rewards });
});

/**
 * @method DELETE
 * @route ~api/share-rewards/delete-reward/:id
 * @description Delete sharing reward (Only Super Admin)
 */
module.exports.deleteSharingRewardCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reward = await prisma.shareReward.findUnique({ where: { id } });

  if (!reward) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Reward with this id not found",
    });
  }

  await prisma.shareReward.delete({ where: { id } });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Reward deleted successfully",
  });
});

/**
 * @method POST
 * @route ~api/share-rewards/share-app/:rewardId
 * @description Share app (Logged in user)
 */
module.exports.shareAppCtrl = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { rewardId } = req.params;
  const { platform } = req.body;

  const reward = await prisma.shareReward.findUnique({
    where: { id: rewardId },
  });

  if (!reward || !reward.isActive) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Reward not found or inactive",
    });
  }

  if (!platform) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Platform is required" });
  }

  const shareRecord = await prisma.userShareRecord.create({
    data: {
      userId,
      rewardId,
      platform,
      earnedDiamonds: 0,
    },
  });

  const shareCount = await prisma.userShareRecord.count({
    where: {
      userId,
      rewardId,
    },
  });

  if (shareCount >= reward.requiredShares) {
    const alreadyRewarded = await prisma.userShareRecord.findFirst({
      where: {
        userId,
        rewardId,
        earnedDiamonds: { gt: 0 },
      },
    });

    if (!alreadyRewarded) {
      let wallet = await prisma.diamondWallet.findFirst({
        where: {
          subscribers: {
            some: { id: userId },
          },
        },
      });

      const currentBalance = wallet?.diamondCount || 0;

      if (!wallet) {
        wallet = await prisma.diamondWallet.create({
          data: {
            diamondCount: reward.diamondReward,
            subscribers: {
              connect: { id: userId },
            },
          },
        });
      } else {
        await prisma.diamondWallet.update({
          where: { id: wallet.id },
          data: {
            diamondCount: { increment: reward.diamondReward },
          },
        });

        wallet = await prisma.diamondWallet.findUnique({
          where: { id: wallet.id },
        });
      }

      await prisma.userShareRecord.update({
        where: { id: shareRecord.id },
        data: {
          earnedDiamonds: reward.diamondReward,
          wallet: wallet ? { connect: { id: wallet.id } } : undefined,
        },
      });

      return res.status(201).json({
        status: httpStatusText.SUCCESS,
        message:
          "The sharing has been added, and the diamond has been awarded to the user",
        shareRecordId: shareRecord.id,
        balanceBefore: currentBalance,
        balanceAfter: wallet.diamondCount,
      });
    }
  }

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: `Reward shared successfully. You have shared ${shareCount}/${reward.requiredShares}.`,
    shareRecord,
  });
});


