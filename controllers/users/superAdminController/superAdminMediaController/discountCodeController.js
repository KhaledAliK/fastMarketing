const asyncHandler = require("express-async-handler");
const httpStatusText = require("../../../../utils/httpStatusText");
const prisma = require("../../../../config/prisma");
const {
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
} = require("../../../../utils/discountCodeValidation");

/**
 * @method POST
 * @route ~api/super-admin/create-discount-code
 * @desc Create discount code (Only Super Admin)
 */
module.exports.createDiscountCodeCtrl = asyncHandler(async (req, res) => {
  const superAdminId = req.user?.id;
  const userId = req.body.userId || null;

  const validation = createDiscountCodeSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const { code, percentage } = validation.data;

  // const existingCode = await prisma.discountCode.findUnique({
  //   where: { code },
  // });

  // if (existingCode) {
  //   return res.status(400).json({
  //     status: httpStatusText.FAIL,
  //     error: [{ field: "code", message: "Discount code already exists" }],
  //   });
  // }

  if (userId) {
    const userExists = await prisma.regularUser.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        error: [{ field: "userId", message: "User not found" }],
      });
    }
  }

  const newDiscountCode = await prisma.discountCode.create({
    data: {
      code,
      percentage,
      superAdmin: {
        connect: { id: superAdminId },
      },
      user: userId
        ? {
            connect: { id: userId },
          }
        : undefined,
    },
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: newDiscountCode,
  });
});

/**
 * @method PUT
 * @route ~api/super-admin/update-discount-code/:id
 * @desc Update discount code (Only Super Admin)
 */
module.exports.updateDiscountCodeCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const validation = updateDiscountCodeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const discountCode = await prisma.discountCode.findUnique({ where: { id } });
  if (!discountCode) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Discount code does not exist",
    });
  }

  const { code, percentage, userId } = validation.data;

  // if (code && code !== discountCode.code) {
  //   const existingCodeWithNewCode = await prisma.discountCode.findUnique({
  //     where: { code },
  //   });

  //   if (existingCodeWithNewCode) {
  //     return res.status(400).json({
  //       status: httpStatusText.FAIL,
  //       message: "Discount code already exists",
  //     });
  //   }
  // }

  const updatedDiscountCode = await prisma.discountCode.update({
    where: { id },
    data: {
      code: code || discountCode.code,
      percentage: percentage || discountCode.percentage,
      user: userId ? { connect: { id: userId } } : undefined,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Discount code updated successfully",
    data: updatedDiscountCode,
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get-discount-code/:id
 * @desc Get single discount code
 */
module.exports.getSingleDiscountCodeCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const discountCode = await prisma.discountCode.findUnique({ where: { id } });
  if (!discountCode) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Discount code not found",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: discountCode });
});

/**
 * @method GET
 * @route ~api/super-admin/get-all-discount-code
 * @desc Get All discount code (Only Super Admin)
 */
module.exports.getAllDiscountCodesCtrl = asyncHandler(async (req, res) => {
  const discountCodes = await prisma.discountCode.findMany();
  if (!discountCodes) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not discount codes",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: discountCodes });
});

/**
 * @method GET
 * @route ~api/super-admin/get-discount-code-count
 * @desc Get count of discount codes (Only Super Admin)
 */
module.exports.getDiscountCodesCountCtrl = asyncHandler(async (req, res) => {
  const count = await prisma.discountCode.count();

  if (!count || count === 0) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not discount codes",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, count });
});

/**
 * @method DELETE
 * @route ~api/super-admin/delete-discount-code/:id
 * @desc Delete discount code (Only Super Admin)
 */
module.exports.deleteDiscountCodeCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const discountCode = await prisma.discountCode.findUnique({ where: { id } });

  if (!discountCode) {
    return res
      .status(404)
      .json({
        status: httpStatusText.FAIL,
        message: "Discount code not found",
      });
  }

  await prisma.discountCode.delete({ where: { id } });
  return res
    .status(200)
    .json({
      status: httpStatusText.SUCCESS,
      message: "Discount code deleted successfully",
    });
});
