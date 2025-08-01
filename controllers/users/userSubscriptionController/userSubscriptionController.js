const asyncHandler = require("express-async-handler");
const prisma = require("../../../config/prisma");
const httpStatusText = require("../../../utils/httpStatusText");

module.exports.createUserSubscriptionCtrl = asyncHandler(async (req, res) => {
  const { id, packageId } = req.body;
  const newUserSubscription = await prisma.userSubscription.create({
    data: {
      id,
      packageId,
      startDate: new Date(),
      expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      isActive: true,
      subscriptionType: "MONTHLY",
    },
  });
  return res.status(201).json({
    status: "Success",
    message: "User subscription created successfully",
    newUserSubscription,
  });
});

/**
 * @method GET
 * @route ~api/user-subscription/get-subscriptions-statistics
 * @desc Get App subscriptions statistics
 */
module.exports.getSubscriptionsStatisticsCtrl = asyncHandler(
  async (req, res) => {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);

    const startOfSixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    );
    const endOfSixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      0
    );
    endOfSixMonthsAgo.setHours(23, 59, 59, 999);

    const startOfOneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      1
    );
    const endOfOneYearAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth() + 1,
      0
    );
    endOfOneYearAgo.setHours(23, 59, 59, 999);

    const subscriptionsCurrentWeek = await prisma.userSubscription.count({
      where: { createdAt: { gte: startOfWeek } },
    });

    const subscriptionsCurrentMonth = await prisma.userSubscription.count({
      where: { createdAt: { gte: startOfCurrentMonth } },
    });

    const subscriptionsLastMonth = await prisma.userSubscription.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const subscriptionsSixMonthsAgo = await prisma.userSubscription.count({
      where: {
        createdAt: {
          gte: startOfSixMonthsAgo,
          lte: endOfSixMonthsAgo,
        },
      },
    });

    const subscriptionsOneYearAgo = await prisma.userSubscription.count({
      where: {
        createdAt: {
          gte: startOfOneYearAgo,
          lte: endOfOneYearAgo,
        },
      },
    });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        subscriptionsCurrentWeek,
        subscriptionsCurrentMonth,
        subscriptionsLastMonth,
        subscriptionsSixMonthsAgo,
        subscriptionsOneYearAgo,
      },
    });
  }
);

async function calculateSubscriptionEarnings(periodStart, periodEnd) {
  const subs = await prisma.userSubscription.findMany({
    where: {
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      package: {
        select: { priceSAR: true, priceUSD: true },
      },
    },
  });

  return subs.reduce(
    (tot, s) => {
      tot.sar += s.package?.priceSAR || 0;
      tot.usd += s.package?.priceUSD || 0;
      return tot;
    },
    { sar: 0, usd: 0 }
  );
}

async function calculateDiamondWalletEarnings(periodStart, periodEnd) {
  const dwSubs = await prisma.diamondWalletSubscription.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
    include: { wallet: { select: { priceSAR: true, priceUSD: true } } },
  });

  return dwSubs.reduce(
    (tot, d) => {
      tot.sar += d.wallet.priceSAR || 0;
      tot.usd += d.wallet.priceUSD || 0;
      return tot;
    },
    { sar: 0, usd: 0 }
  );
}

module.exports.getEarningsStatisticsCtrl = asyncHandler(async (req, res) => {
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfCurrentMonth.setHours(23, 59, 59, 999);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  const startOfSixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 6,
    1
  );
  const endOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 0);
  endOfSixMonthsAgo.setHours(23, 59, 59, 999);

  const startOfOneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const endOfOneYearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth() + 1,
    0
  );
  endOfOneYearAgo.setHours(23, 59, 59, 999);

  const periods = [
    { key: "currentWeek", start: startOfWeek, end: now },
    { key: "currentMonth", start: startOfCurrentMonth, end: now },
    { key: "lastMonth", start: startOfLastMonth, end: endOfLastMonth },
    { key: "sixMonthsAgo", start: startOfSixMonthsAgo, end: endOfSixMonthsAgo },
    { key: "oneYearAgo", start: startOfOneYearAgo, end: endOfOneYearAgo },
  ];

  const data = {};

  for (const period of periods) {
    const subscriptions = await calculateSubscriptionEarnings(
      period.start,
      period.end
    );
    const diamondWallet = await calculateDiamondWalletEarnings(
      period.start,
      period.end
    );

    data[period.key] = {
      subscriptions,
      diamondWallet,
      total: {
        sar: subscriptions.sar + diamondWallet.sar,
        usd: subscriptions.usd + diamondWallet.usd,
      },
    };
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data,
  });
});

