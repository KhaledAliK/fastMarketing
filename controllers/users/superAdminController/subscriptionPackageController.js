const asyncHandler = require("express-async-handler");
const prisma = require("../../../config/prisma");
const httpStatusText = require("../../../utils/httpStatusText");
const {
  UpdateSubscriptionPackageSchema,
} = require("../../../utils/validationSchemas");
const {
  createPackageSchema,
  updatePackageSchema,
} = require("../../../utils/subscriptionPackageValidation");

/**
 * @method POST
 * @route ~api/super-admin/subscription-package/create
 * @desc Create subscription package (Only Super Admin)
 */
module.exports.createSubscriptionPackageCtrl = asyncHandler(
  async (req, res) => {
    const superAdminId = req.user?.id;
    const validation = createPackageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        error: validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    const packageData = validation.data;

    const newPackage = await prisma.subscriptionPackage.create({
      data: { ...packageData, superAdminId },
    });

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Package created successfully",
      package: newPackage,
    });
  }
);

/**
 * @method GET
 * @route ~api/super-admin/subscription-package/get-all-packages
 * @desc Get subscription packages (Only Super Admin)
 */
module.exports.getAllSubscriptionPackage = asyncHandler(async (req, res) => {
  const package = await prisma.subscriptionPackage.findMany();
  if (package.length < 1 || package.length === 0) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There no packages" });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: package });
});

/**
 * @method GET
 * @route ~api/super-admin/subscription-package/get-package/:id
 * @desc Get subscription package (Only Super Admin)
 */
module.exports.getSingleSubscriptionPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const package = await prisma.subscriptionPackage.findUnique({
    where: { id },
  });
  if (!package) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Subscription package not found",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, message: package });
});

/**
 * @method PUT
 * @route ~api/super-admin/subscription-package/update-package/:id
 * @desc Update subscription package (Only Super Admin)
 */
module.exports.updateSubscriptionPackageCtrl = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Subscription package ID is required",
      });
    }

    const validation = updatePackageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        error: validation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    const package = await prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!package) {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        message: "Subscription package not found",
      });
    }

    const updatePackage = await prisma.subscriptionPackage.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Subscription package updated successfully",
      updatePackage,
    });
  }
);

/**
 * @method DELETE
 * @route ~api/super-admin/subscription-package/delete-package/:id
 * @desc Delete subscription package (Only Super Admin)
 */
module.exports.deleteSubscriptionPackageCtrl = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const package = await prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!package) {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        message: "Subscription package not found",
      });
    }

    await prisma.subscriptionPackage.delete({ where: { id } });
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "subscription package deleted successfully",
    });
  }
);
