const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");
const jwt = require("jsonwebtoken");
const { updateUserSchema } = require("../../utils/validationSchemas");
const httpStatus = require("../../utils/httpStatusText");

/**
 * @method GET
 * @route ~/api/user/:userId
 * @desc Get a user's account (Super Admin can access all)
 * @access Private (Super Admin, User itself)
 */
module.exports.getUserAccount = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;

    if (loggedInUser.role === "SUPER_ADMIN") {
      const user = await prisma.superAdmin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          role: true,
          verified: true,
          createdAt: true,
        },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({ status: "SUCCESS", user });
    }
    if (loggedInUser.id === userId) {
      const user = await prisma.superAdmin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          role: true,
          verified: true,
          createdAt: true,
        },
      });
      return res.status(200).json({ status: "SUCCESS", user });
    }
    return res
      .status(403)
      .json({ message: "Unauthorized to access this user account" });
  } catch (error) {
    console.error("Error fetching user account:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @method PATCH
 * @route ~/api/user/update/:userId
 * @desc Update user details (Super Admin or user themselves)
 */
module.exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;
    const updateData = req.body;
    if (loggedInUser.role !== "SUPER_ADMIN" && loggedInUser.id !== userId) {
      return res.status(403).json({
        status: httpStatus.FAIL,
        message: "Unauthorized to update this user",
      });
    }

    const validation = updateUserSchema.safeParse(updateData);
    if (!validation.success) {
      return res.status(400).json({
        status: httpStatus.FAIL,
        message: validation.error.errors[0].message,
      });
    }
    const restrictedFields = ["role", "password", "createdAt", "verified"];
    if (
      loggedInUser.role !== "SUPER_ADMIN" &&
      Object.keys(updateData).some((field) => restrictedFields.includes(field))
    ) {
      return res.status(403).json({
        status: httpStatus.FAIL,
        message: "You are not authorized to update these fields",
      });
    }
    const updatedUser = await prisma.superAdmin.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        verified: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({
      status: httpStatus.SUCCESS,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @method DELETE
 * @route ~/api/user/delete/:userId
 * @desc Delete user details (Super Admin or user themselves)
 */
module.exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;
    const userToDelete = await prisma.superAdmin.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return res.status(404).json({
        status: httpStatus.FAIL,
        message: "User not found",
      });
    }
    if (userToDelete.role === "SUPER_ADMIN") {
      return res.status(403).json({
        status: httpStatus.FAIL,
        message: "Super Admin accounts cannot be deleted",
      });
    }
    if (loggedInUser.role !== "SUPER_ADMIN" && loggedInUser.id !== userId) {
      return res.status(403).json({
        status: httpStatus.FAIL,
        message: "Unauthorized to delete this user",
      });
    }
    await prisma.verificationToken.deleteMany({
      where: { userId },
    });
    await prisma.superAdmin.delete({
      where: { id: userId },
    });
    return res.status(200).json({
      status: httpStatus.SUCCESS,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
