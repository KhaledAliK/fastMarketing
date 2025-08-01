const asyncHandler = require("express-async-handler");
const prisma = require("../../../../config/prisma");
const httpStatusText = require("../../../../utils/httpStatusText");
const {
  policySchema,
  updatePolicySchema,
} = require("../../../../utils/policyValidation");

/**
 * @method POST
 * @route ~/api/admin/create-policy
 * @desc Create Policy (Only Super Admin)
 */
module.exports.createPolicyCtrl = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const validation = policySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const newPolicy = await prisma.policy.create({ data: { content } });
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Policy created successfully",
    data: newPolicy,
  });
});

/**
 * @method GET
 * @route ~/api/admin/get-policy
 * @desc Get Policy (Only Super Admin)
 */
module.exports.getPolicyCtrl = asyncHandler(async (req, res) => {
  const policy = await prisma.policy.findFirst();

  if (!policy) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Policy not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: policy });
});

/**
 * @method PUT
 * @route ~/api/admin/update-policy/:id
 * @desc Update Policy (Only Super Admin)
 */
module.exports.updatePolicyCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const validation = updatePolicySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const policy = await prisma.policy.findUnique({ where: { id } });

  if (!policy) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Policy not found" });
  }

  const updatedPolicy = await prisma.policy.update({
    where: { id },
    data: {
      content,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Policy updated successfully",
    updatedPolicy,
  });
});

/**
 * @method PUT
 * @route ~/api/admin/delete-policy/:id
 * @desc Delete Policy (Only Super Admin)
 */
module.exports.deletePolicyCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const policy = await prisma.policy.findUnique({ where: { id } });

  if (!policy) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Policy not found" });
  }

  await prisma.policy.delete({ where: { id } });
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Policy deleted successfully",
  });
});

/**
 * @method PUT
 * @route ~/api/admin/get-all-polices
 * @desc Logged in users
 */
module.exports.getAllPolices = asyncHandler(async (req, res) => {
  const polices = await prisma.policy.findMany();
  if (!polices) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There are no polices" });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: polices });
});
