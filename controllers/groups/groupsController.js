const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");
const httpStatusText = require("../../utils/httpStatusText");
const { createGroupSchema } = require("../../utils/validators/groupValidation");
const fs = require("fs");
const path = require("path");
const { cloudinaryUploadingImage } = require("../../utils/cloudinary");

/**
 * @method POST
 * @route ~api/groups/create-group
 * @desc Create group (Only Super Admin)
 */
module.exports.createGroupCtrl = asyncHandler(async (req, res) => {
  const { platformId } = req.params;

  if (!platformId) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Platform ID is required",
    });
  }

  const validation = createGroupSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        fields: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const { name, description, countryName } = validation.data;

  if (!req.file) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, message: "No file provided" });
  }

  const imagePath = path.join(__dirname, `../../images/${req.file.filename}`);

  const result = await cloudinaryUploadingImage(imagePath);

  const newGroup = await prisma.group.create({
    data: {
      name,
      description,
      countryName,
      countryFlag: result.secure_url,
      publicId: result.public_id,
      creatorId: req.user.id,
      platformId,
    },
  });

  fs.unlinkSync(imagePath);

  return res.status(201).json({ status: httpStatusText.SUCCESS, newGroup });
});

/**
 * @method GET
 * @route ~api/groups/get-single-group
 * @desc Get Single group (Only Super Admin)
 */
module.exports.getSingleGroupCtrl = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Group not found" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, group });
});

/**
 * @method GET
 * @route ~api/groups/get-group
 * @desc Get all groups (Only Super Admin)
 */
module.exports.getAllGroupsCtrl = asyncHandler(async (req, res) => {
  const groups = await prisma.group.findMany();

  if (!groups) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There are not groups" });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, groups });
});

/**
 * @method DELETE
 * @route ~api/groups/delete-group/:groupId
 * @desc Delete group (Only Super Admin)
 */
module.exports.deleteGroupCtrl = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Group not found" });
  }

  await prisma.group.delete({ where: { id: groupId } });

  return res
    .status(200)
    .json({
      status: httpStatusText.SUCCESS,
      message: "Group deleted successfully",
    });
});
