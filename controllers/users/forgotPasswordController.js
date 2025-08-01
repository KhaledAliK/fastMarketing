const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/sendEmail");
const httpStatusText = require("../../utils/httpStatusText");
const findUserByEmail = require("../../utils/findUser");
const { PrismaClient, Role } = require("@prisma/client");
const { resetPasswordSchema } = require("../../utils/validationSchemas");
const { BASE_URL } = require("../../utils/envMode");
require("dotenv").config();
const prisma = new PrismaClient();

const roleMapping = {
  superadmin: Role.SUPER_ADMIN,
  regularuser: Role.REGULAR_USER,
  supervisor: Role.SUPERVISOR,
  sales: Role.SALES,
};

/**
 * @method POST
 * @route ~/api/auth/forgot-password
 * @desc Send password reset link
 */
module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { user, table } = await findUserByEmail(email);
  if (!user) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "User with this email does not exist",
    });
  }

  const userType = roleMapping[table.toLowerCase()];
  if (!userType) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Invalid user type",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.upsert({
    where: { [`${table}Id`]: user.id },
    update: { token },
    create: { [`${table}Id`]: user.id, token, userType },
  });

  const frontendBase = (
    process.env.FRONTEND_BASE_URL ||
    "https://marvelous-babka-ab227f.netlify.app"
  ).replace(/\/+$/, "");

  const resetUrl = `${frontendBase}/reset-password/${user.id}/${token}`;
  await sendEmail(
    email,
    "Password Reset Request",
    `Reset your password: ${resetUrl}`
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Password reset link sent to email",
  });
});

/**
 * @method POST
 * @route ~/api/auth/reset-password/:userId/:token
 * @desc Reset user password
 */
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;
  const { newPassword } = req.body;
  const validation = resetPasswordSchema.safeParse({ newPassword });
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: validation.error.errors[0].message,
    });
  }
  const storedToken = await prisma.verificationToken.findFirst({
    where: {
      OR: [
        { superAdminId: userId },
        { regularUserId: userId },
        { supervisorId: userId },
        { salesId: userId },
      ],
      token,
    },
  });
  if (!storedToken) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Invalid or expired token",
    });
  }
  const roleToTableMap = {
    SUPER_ADMIN: "superAdmin",
    REGULAR_USER: "regularUser",
    SUPERVISOR: "supervisor",
    SALES: "sales",
  };
  const userType = roleToTableMap[storedToken.userType];
  if (!userType) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Invalid user role",
    });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma[userType].update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  await prisma.verificationToken.delete({ where: { id: storedToken.id } });
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Password reset successfully",
  });
});

/**
 * @method GET
 * @route ~/api/auth/reset-password/:userId/:token
 * @desc Reset user password form (for testing)
 */
module.exports.resetPasswordForm = asyncHandler(async (req, res) => {
  res.send(`
      <form action="/api/auth/reset-password/${req.params.userId}/${req.params.token}" method="POST">
        <input type="password" name="newPassword" placeholder="Enter new password" required />
        <button type="submit">Reset Password</button>
      </form>
    `);
});
