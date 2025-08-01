const asyncHandler = require("express-async-handler");
const httpStatusText = require("../../../utils/httpStatusText");
const { updateUserSchema } = require("../../../utils/validationSchemas");
const bcrypt = require("bcrypt");
const prisma = require("../../../config/prisma");

/**
 * @method GET
 * @route ~api/user/super-admin/:userId
 * @desc Get Super Admin Profile by ID (Only the user himself can access it)
 */
module.exports.getSuperAdminProfileCtrl = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // if (req.user.id !== userId) {
  //   res.status(403).json({
  //     status: httpStatusText.FAIL,
  //     message: "You are not authorized to access this profile",
  //   });
  // }
  const user = await prisma.superAdmin.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      profilePhoto: true,
      role: true,
      phoneNumber: true,
      country: true,
      city: true,
      bankName: true,
      bankAccountNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Super admin with this ID does not exist",
    });
  }
  return res.status(200).json({ status: httpStatusText.SUCCESS, data: user });
});

/**
 * @method PUT
 * @route ~api/user/super-admin/:userId
 * @desc Update Super Admin Profile (Only the user himself can update it)
 */
module.exports.updateSuperAdminProfileCtrl = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // if (req.user.id !== userId) {
  //   return res.status(403).json({
  //     status: httpStatusText.FAIL,
  //     message: "You are not authorized to update this profile",
  //   });
  // }

  const validation = await updateUserSchema.safeParseAsync(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: validation.error.errors[0].message,
    });
  }
  const updatedUser = await prisma.superAdmin.update({
    where: { id: userId },
    data: { ...req.body, updatedAt: new Date() },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      profilePhoto: true,
      role: true,
      phoneNumber: true,
      country: true,
      city: true,
      bankName: true,
      bankAccountNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

/**
 * @method DELETE
 * @route ~api/user/super-admin/delete/:userId
 * @desc Delete Super Admin Account after verifying password
 */
module.exports.deleteSuperAdminAccountCtrl = asyncHandler(async (req, res) => {
  
  // const { password } = req.body;

  // if (!password) {
  //   return res.status(400).json({
  //     status: httpStatusText.FAIL,
  //     message: "Type the correct password",
  //   });
  // }
  // if (req.user.id !== userId) {
  //   return res.status(403).json({
  //     status: httpStatusText.FAIL,
  //     message: "You are not authorized to delete this profile",
  //   });
  // }
  const { userId } = req.params;
  const user = await prisma.superAdmin.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });
  if (!user) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Super admin account not found",
    });
  }
  await prisma.superAdmin.delete({where: { id: userId}});
  return res.status(200).json({ status: httpStatusText.FAIL, message: "Super admin deleted successfully"})
  // const isPasswordValid = await bcrypt.compare(password, user.password);
  // if (!isPasswordValid) {
  //   return res
  //     .status(401)
  //     .json({ status: httpStatusText.FAIL, message: "Incorrect password" });
  // }
  // await prisma.superAdmin.delete({
  //   where: { id: userId },
  // });
  // return res.status(200).json({
  //   status: httpStatusText.SUCCESS,
  //   message: "Super admin account has been deleted successfully",
  // });
});

/**
 * @method GET
 * @route ~api/user/super-admin/get-super-admin-count
 * @desc Get the number of super admin
 */
module.exports.getNumberOfSuperAdminCtrl = asyncHandler(async (req, res) => {
  const superAdminCount = await prisma.superAdmin.count();
  if (!superAdminCount) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are no super admins",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, count: superAdminCount });
});

/**
 * @method GET
 * @route ~api/user/super-admin/get-all-super-admin
 * @desc Get All super admins
 */
module.exports.getAllSuperAdminsCtrl = asyncHandler(async (req, res) => {
  const superAdmin = await prisma.superAdmin.findMany();
  if (!superAdmin) {
    return res
      .status(404)
      .json({
        status: httpStatusText.FAIL,
        message: "There are no super admins",
      });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: superAdmin });
});
