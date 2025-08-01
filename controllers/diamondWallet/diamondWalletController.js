const prisma = require("../../config/prisma");
const asyncHandler = require("express-async-handler");
const httpStatusText = require("../../utils/httpStatusText");
const {
  createDiamondWalletSchema,
  updateDiamondWalletSchema,
} = require("../../utils/diamondWalletValidation");

/**
 * @method POST
 * @route ~api/wallet/create
 * @desc Create a diamond wallet (Only Super admin)
 */
module.exports.createDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const { diamondCount, priceSAR, priceUSD } = req.body;

  const validation = createDiamondWalletSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const diamondWallet = await prisma.diamondWallet.create({
    data: {
      diamondCount,
      priceSAR,
      priceUSD,
    },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Diamond wallet created successfully",
    diamondWallet,
  });
});

/**
 * @method PUT
 * @route ~api/wallet/update/:id
 * @desc Update a diamond wallet (Only Super admin)
 */
module.exports.updateDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { diamondCount, priceSAR, priceUSD } = req.body;

  const validation = updateDiamondWalletSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const diamondWallet = await prisma.diamondWallet.findUnique({
    where: { id },
  });

  if (!diamondWallet) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Diamond wallet not found",
    });
  }

  const updatedDiamondWallet = await prisma.diamondWallet.update({
    where: { id },
    data: {
      diamondCount,
      priceSAR,
      priceUSD,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Diamond wallet updated successfully",
    updatedDiamondWallet,
  });
});

/**
 * @method GET
 * @route ~api/wallet/get/:id
 * @desc Get a single diamond wallet
 */
module.exports.getSingleDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const diamondWallet = await prisma.diamondWallet.findUnique({
    where: { id },
  });

  if (!diamondWallet) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Diamond wallet not found",
    });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, diamondWallet });
});

/**
 * @method GET
 * @route ~api/wallet/get
 * @desc Get all diamond wallet
 */
module.exports.getAllDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const diamondWallets = await prisma.diamondWallet.findMany();

  if (!diamondWallets) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not diamond wallets",
    });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: diamondWallets });
});

/**
 * @method DELETE
 * @route ~api/wallet/delete/:id
 * @desc Delete a diamond wallet (Only super admin)
 */
module.exports.deleteDiamondWalletCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const diamondWallet = await prisma.diamondWallet.findUnique({
    where: { id },
  });

  if (!diamondWallet) {
    return res
      .status(404)
      .json({
        status: httpStatusText.FAIL,
        message: "There is not diamond wallet",
      });
  }

  await prisma.diamondWallet.delete({ where: { id } });

  return res
    .status(200)
    .json({
      status: httpStatusText.SUCCESS,
      message: "Diamond wallet deleted successfully",
    });
});
