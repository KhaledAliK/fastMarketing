const asyncHandler = require("express-async-handler");
const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const {
  updateSocialAccountSchema,
  socialAccountSchema,
} = require("../../../../utils/accountValidation");

/**
 * @method POST
 * @route ~api/super-admin/create-account
 * @desc Create Account (Only Super Admin)
 */
module.exports.createAccountCtrl = asyncHandler(async (req, res) => {
  const { platform, username, url } = req.body;

  const validation = socialAccountSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const account = await prisma.account.create({
    data: { platform, username, url },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Account created successfully.",
    account,
  });
});

/**
 * @method PUT
 * @route ~api/super-admin/update-account/:id
 * @desc Update Account (Only Super Admin)
 */
module.exports.updateAccountCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const validation = updateSocialAccountSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Account not found" });
  }

  const updatedAccount = await prisma.account.update({
    where: { id },
    data: req.body,
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Account updated successfully",
    updatedAccount,
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get-account/:id
 * @desc Get Single Account (Only Super Admin)
 */
module.exports.getSingleAccountCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Account not found" });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: account });
});

/**
 * @method GET
 * @route ~api/super-admin/get-all-accounts
 * @desc Get All Accounts (Only Super Admin)
 */
module.exports.getAllAccountsCtrl = asyncHandler(async (req, res) => {
  const account = await prisma.account.findMany();
  if (!account) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "No social accounts found",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: account });
});

/**
 * @method DELETE
 * @route ~api/super-admin/delete-account/:id
 * @desc Delete Account (Only Super Admin)
 */
module.exports.deleteAccountCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Account not found" });
  }

  await prisma.account.delete({ where: { id } });

  return res
    .status(200)
    .json({
      status: httpStatusText.SUCCESS,
      message: "Account deleted successfully",
    });
});
