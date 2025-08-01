const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const {
  registerSchema,
  loginSchema,
} = require("../../../utils/validationSchemas");
const prisma = require("../../../config/prisma");
const httpStatus = require("../../../utils/httpStatusText");
const crypto = require("crypto");
const { Role } = require("@prisma/client");
const sendEmail = require("../../../utils/sendEmail");
const checkUserExists = require("../../../utils/checkUserExists");
const { loginUserExists } = require("../../../utils/loginUserExists");
const { cloudinaryUploadingImage } = require("../../../utils/cloudinary");
const fs = require("fs");
const path = require("path");
const { BASE_URL } = require("../../../utils/envMode");

require("dotenv").config();

/**
 * @method POST
 * @route ~/api/user/super-admin/register
 * @desc Register a new Super Admin
 */

module.exports.registerSuperAdminCtrl = asyncHandler(async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    password,
    phoneNumber,
    country,
    city,
    bankName,
    bankAccountNumber,
    permissions,
  } = req.body;

  const validation = await registerSchema.safeParseAsync(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatus.FAIL,
      message: validation.error.errors[0].message,
    });
  }

  const userExists = await checkUserExists(email, phoneNumber, "superAdmin");

  if (userExists.exists) {
    return res
      .status(400)
      .json({ status: httpStatus.FAIL, message: userExists.message });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let profilePhoto = {
    url: "https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_1280.png",
    publicId: null,
  };

  if (req.file && req.file.path) {
    const uploadedData = await cloudinaryUploadingImage(req.file.path);
    if (uploadedData.secure_url) {
      profilePhoto = {
        url: uploadedData.secure_url,
        publicId: uploadedData.public_id,
      };
    }
  }
  const imagePath = path.join(
    __dirname,
    `../../../images/${req.file.filename}`
  );
  const newSuperAdmin = await prisma.superAdmin.create({
    data: {
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      phoneNumber,
      country: req.body.country || null,
      city: req.body.city || null,
      profilePhoto,
      bankName: req.body.bankName || null,
      bankAccountNumber: bankAccountNumber || null,
      verified: false,
      permissions: permissions || [],
    },
  });
  const token = jwt.sign(
    { userId: newSuperAdmin.id, role: Role.SUPER_ADMIN },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  await prisma.verificationToken.create({
    data: {
      superAdminId: newSuperAdmin.id,
      token,
      userType: Role.SUPER_ADMIN,
    },
  });

  const verifyUrl = `${BASE_URL}/api/user/verify/${
    newSuperAdmin.id
  }/${encodeURIComponent(token)}`;
  await sendEmail(
    newSuperAdmin.email,
    "Verify Your Email",
    `Click here: ${verifyUrl}`
  );
  fs.unlinkSync(imagePath);
  return res.status(201).json({
    status: httpStatus.SUCCESS,
    message:
      "Super Admin registered successfully. Check your email to verify your account.",
    newSuperAdmin,
  });
});

/**
 * @method POST
 * @route ~/api/user/super-admin/login
 * @desc Login User & Generate Token
 */
module.exports.loginSuperAdminCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const validation = await loginSchema.safeParseAsync(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatus.FAIL,
      message: validation.error.errors[0].message,
    });
  }
  const { exists, user, role } = await loginUserExists(email);
  if (!exists) {
    return res.status(404).json({
      status: httpStatus.FAIL,
      message: "Invalid credentials",
    });
  }

  if (role !== "SUPER_ADMIN" && role !== "SUPERVISOR") {
    return res.status(403).json({
      status: httpStatus.FAIL,
      message: "You are not authorized to access this route",
    });
  }

  if (!user.verified) {
    return res.status(401).json({
      status: httpStatus.FAIL,
      message: "You have to verify your email to login",
    });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      status: httpStatus.FAIL,
      message: "Invalid credentials",
    });
  }
  const token = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  return res.status(200).json({
    status: httpStatus.SUCCESS,
    message: "Login successful",
    token,
    role,
    user: {
      ...user,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

/**
 * @method POST
 * @route ~/api/user/verify/:userId/:token
 * @desc Send password reset link
 */
module.exports.verifyEmail = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;
  const storedToken = await prisma.verificationToken.findUnique({
    where: {
      OR: [
        { superAdminId: userId },
        { regularUserId: userId },
        { supervisorId: userId },
        { salesId: userId },
      ],
      token: token,
    },
  });
  if (!storedToken) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  let userModel = null;
  if (storedToken.superAdminId) {
    userModel = prisma.superAdmin;
  } else if (storedToken.regularUserId) {
    userModel = prisma.regularUser;
  } else if (storedToken.supervisorId) {
    userModel = prisma.supervisor;
  } else if (storedToken.salesId) {
    userModel = prisma.sales;
  }
  if (!userModel) {
    return res.status(400).json({ message: "User role not recognized" });
  }
  await userModel.update({
    where: { id: userId },
    data: { verified: true },
  });
  await prisma.verificationToken.delete({
    where: { id: storedToken.id },
  });

  return res.json({ message: "Email verified successfully!" });
});

/**
 * @method POST
 * @route ~/api/user/resend-verification
 * @desc Send verification link
 */
// module.exports.resendVerificationEmail = asyncHandler(async (req, res) => {
//   const { email } = req.body;
//   let user = await prisma.superAdmin.findUnique({ where: { email } });
//   let userType = "SUPER_ADMIN";
//   let userIdField = "superAdminId";

//   if (!user) {
//     user = await prisma.regularUser.findUnique({ where: { email } });
//     userType = "REGULAR_USER";
//     userIdField = "regularUserId";
//   }
//   if (!user) {
//     user = await prisma.supervisor.findUnique({ where: { email } });
//     userType = "SUPERVISOR";
//     userIdField = "supervisorId";
//   }
//   if (!user) {
//     user = await prisma.sales.findUnique({ where: { email } });
//     userType = "SALES";
//     userIdField = "salesId";
//   }

//   if (!user) {
//     return res
//       .status(400)
//       .json({ status: httpStatus.FAIL, message: "User not found" });
//   }

//   if (user.verified) {
//     return res.status(400).json({
//       status: httpStatus.FAIL,
//       message: "User is already verified",
//     });
//   }
//   const token = crypto.randomBytes(32).toString("hex");
//   await prisma.verificationToken.upsert({
//     where: {
//       [userIdField]: user.id,
//     },
//     update: { token },
//     create: {
//       [userIdField]: user.id,
//       token,
//       userType,
//     },
//   });
//   const verifyUrl = `${process.env.BASE_URL}/api/user/verify/${user.id}/${token}`;
//   await sendEmail(user.email, "Verify Your Email", `Click here: ${verifyUrl}`);
//   return res.status(200).json({
//     status: httpStatus.SUCCESS,
//     message: "Verification email sent again.",
//   });
// });

/**
 * @method POST
 * @route ~/api/user/forgot-password
 * @desc Send password reset link
 */
// module.exports.forgotPassword = asyncHandler(async (req, res) => {
//   const { email } = req.body;
//   let user = await prisma.superAdmin.findUnique({ where: { email } });
//   let userType = "SUPER_ADMIN";
//   let userIdField = "superAdminId";

//   if (!user) {
//     user = await prisma.regularUser.findUnique({ where: { email } });
//     userType = "REGULAR_USER";
//     userIdField = "regularUserId";
//   }
//   if (!user) {
//     user = await prisma.supervisor.findUnique({ where: { email } });
//     userType = "SUPERVISOR";
//     userIdField = "supervisorId";
//   }
//   if (!user) {
//     user = await prisma.sales.findUnique({ where: { email } });
//     userType = "SALES";
//     userIdField = "salesId";
//   }

//   if (!user) {
//     return res.status(404).json({
//       status: httpStatus.FAIL,
//       message: "User with this email does not exist",
//     });
//   }
//   const token = crypto.randomBytes(32).toString("hex");
//   await prisma.verificationToken.upsert({
//     where: {
//       [userIdField]: user.id,
//     },
//     update: { token },
//     create: {
//       [userIdField]: user.id,
//       token,
//       userType,
//     },
//   });

//   const resetUrl = `${process.env.BASE_URL}/api/user/reset-password/${user.id}/${token}`;
//   await sendEmail(
//     user.email,
//     "Password Reset Request",
//     `Click here to reset your password: ${resetUrl}`
//   );

//   return res.status(200).json({
//     status: httpStatus.SUCCESS,
//     message: "Password reset link sent to email",
//   });
// });

/**
 * @method POST
 * @route ~/api/user/reset-password/:userId/:token
 * @desc Reset user password
 */
// module.exports.resetPassword = asyncHandler(async (req, res) => {
//   const { userId, token } = req.params;
//   const { newPassword } = req.body;

//   if (!newPassword) {
//     return res.status(400).json({
//       status: httpStatus.FAIL,
//       message: "New password is required",
//     });
//   }
//   const storedToken = await prisma.verificationToken.findFirst({
//     where: {
//       OR: [
//         { superAdminId: userId },
//         { regularUserId: userId },
//         { supervisorId: userId },
//         { salesId: userId },
//       ],
//       token,
//     },
//   });

//   if (!storedToken) {
//     return res.status(400).json({
//       status: httpStatus.FAIL,
//       message: "Invalid or expired token",
//     });
//   }

//   let user = null;
//   if (storedToken.superAdminId) {
//     user = await prisma.superAdmin.update({
//       where: { id: userId },
//       data: { password: await bcrypt.hash(newPassword, 10) },
//     });
//   } else if (storedToken.regularUserId) {
//     user = await prisma.regularUser.update({
//       where: { id: userId },
//       data: { password: await bcrypt.hash(newPassword, 10) },
//     });
//   } else if (storedToken.supervisorId) {
//     user = await prisma.supervisor.update({
//       where: { id: userId },
//       data: { password: await bcrypt.hash(newPassword, 10) },
//     });
//   } else if (storedToken.salesId) {
//     user = await prisma.sales.update({
//       where: { id: userId },
//       data: { password: await bcrypt.hash(newPassword, 10) },
//     });
//   }
//   if (!user) {
//     return res.status(404).json({
//       status: httpStatus.FAIL,
//       message: "User not found",
//     });
//   }
//   await prisma.verificationToken.delete({ where: { id: storedToken.id } });
//   return res.status(200).json({
//     status: httpStatus.SUCCESS,
//     message: "Password reset successfully",
//   });
// });

/**
 * @method GET
 * @route ~/api/user/reset-password/:userId/:token
 * @desc Reset user password
 */
// module.exports.resetPasswordForm = asyncHandler(async (req, res) => {
//   res.send(`
//     <form action="/api/user/reset-password/${req.params.userId}/${req.params.token}" method="POST">
//       <input type="password" name="newPassword" placeholder="Enter new password" required />
//       <button type="submit">Reset Password</button>
//     </form>
//   `);
// });
