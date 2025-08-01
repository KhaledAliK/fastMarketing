const httpStatusText = require("../../utils/httpStatusText");
const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");

/**
 * @method POST
 * @route ~api/wallet/subscribe/regular-user/:userId
 * @desc Subscribe to the diamond wallet
 */
module.exports.subscribeToDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { walletId } = req.params;

  const existing = await prisma.diamondWalletSubscription.findFirst({
    where: { userId, walletId },
  });

  if (existing) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "User already subscribed to this diamond wallet",
    });
  }

  const wallet = await prisma.diamondWallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Diamond wallet not exists",
    });
  }

  const subscription = await prisma.diamondWalletSubscription.create({
    data: {
      userId,
      walletId,
      diamondCount: wallet.diamondCount,
    },
  });

  await prisma.regularUser.update({
    where: { id: userId },
    data: {
      diamondBalance: {
        increment: wallet.diamondCount,
      },
    },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Subscribed successfully",
    subscription,
  });
});


/**
 * @method POST
 * @route ~api/wallet/consume-diamond/regular-user/:userId
 * @desc Subscribe the user in the diamond wallet
 */
module.exports.consumeRegularUserDiamondWalletCtrl = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;
    const { walletId, amount } = req.body;

    const userWallet = await prisma.diamondWalletSubscription.findFirst({
      where: {
        userId,
        walletId,
      },
    });
    if (!userWallet) {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        message: "User not subscribed to this wallet",
      });
    }
    if (userWallet.diamondCount < amount) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Insufficient diamonds",
      });
    }
    const updatedWallet = await prisma.diamondWalletSubscription.update({
      where: { id: userWallet.id },
      data: {
        diamondCount: {
          decrement: amount,
        },
      },
    });
    return res.status(200).json({
      status: httpStatusText.FAIL,
      message: "Diamonds consumed successfully",
      updatedWallet,
    });
  }
);

/**
 * @method POST
 * @route ~api/wallet/subscriber-user/consume-diamond/:userId
 * @desc Subscribe the user in the diamond wallet
 */
module.exports.consumeSubscriptionUserDiamondWalletCtrl = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;
    const { walletId, amount } = req.body;
    const subscriptionWallet = await prisma.diamondWalletSubscription.findFirst(
      {
        where: {
          userId,
          walletId,
        },
      }
    );
    if (!subscriptionWallet) {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        message: "Subscription not linked to this wallet",
      });
    }
    const updatedWallet = await prisma.diamondWalletSubscription.update({
      where: { id: subscriptionWallet.id },
      data: {
        diamondCount: { decrement: amount },
      },
    });
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Diamonds consumed successfully",
      updatedWallet,
    });
  }
);
