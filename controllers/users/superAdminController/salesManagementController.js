const asyncHandler = require("express-async-handler");
const httpStatusText = require("../../../utils/httpStatusText");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  salesSchema,
  loginSalesSchema,
  updateSalesSchema,
  updateSalesEmail,
} = require("../../../utils/salesValidation");
const sendEmail = require("../../../utils/sendEmail");
const prisma = require("../../../config/prisma");
const { cloudinaryUploadingImage } = require("../../../utils/cloudinary");
const fs = require("fs");
const path = require("path");

/**
 * @method POST
 * @route ~api/supervisor/create/supervisor
 * @desc Create Sales (Only Super Admin or Supervisor)
 */
module.exports.createSalesCtrl = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole !== "SUPER_ADMIN" && userRole !== "SUPERVISOR") {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to create a sales account",
    });
  }

  const validation = salesSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      errors: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const { email, password, phoneNumber, ...other } = req.body;

  const userTables = ["superAdmin", "supervisor", "sales", "regularUser"];

  const existingUser = await Promise.all(
    userTables.map(async (table) =>
      prisma[table].findUnique({ where: { email } })
    )
  );

  if (existingUser.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Email already exists in another account",
    });
  }

  const existingPhone = await Promise.all(
    userTables.map(async (table) =>
      prisma[table].findUnique({ where: { phoneNumber } })
    )
  );

  if (existingPhone.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number already exists in another account",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (userRole === "SUPERVISOR" && !userId) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Supervisor ID is missing",
    });
  }

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
  fs.unlinkSync(imagePath);

  const newSales = await prisma.sales.create({
    data: {
      email,
      password: hashedPassword,
      phoneNumber,
      profilePhoto,
      ...other,
      supervisorId: userRole === "SUPERVISOR" ? userId : null,
    },
  });

  const token = jwt.sign(
    { id: newSales.id, email: newSales.email, role: newSales.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  await prisma.verificationToken.create({
    data: {
      token,
      userType: "SALES",
      salesId: newSales.id,
    },
  });

  const verificationLink = `${process.env.BASE_URL}/api/user/verify/${newSales.id}/${token}`;
  await sendEmail(
    newSales.email,
    "Verify Your Email",
    `Hello ${
      other.firstName || newSales.email
    },\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 7 days.`
  );

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message:
      "Sales created successfully. Please check your email to verify your account.",
    sales: newSales,
  });
});

/**
 * @method POST
 * @route ~api/supervisor/login/sales
 * @desc Login sales account
 */
module.exports.loginSalesCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const validation = loginSalesSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  const sales = await prisma.sales.findUnique({ where: { email } });
  if (!sales) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  }
  if (!sales.verified) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "Please verify your email before logging in",
    });
  }
  const isPasswordMatch = await bcrypt.compare(password, sales.password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  }
  const token = jwt.sign(
    { id: sales.id, email: sales.email, role: sales.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Logged in successfully",
    token,
  });
});

/**
 * @method PUT
 * @route ~api/supervisor/update/sales/:id
 * @desc Update sales account (excluding phone number)
 */
module.exports.updateSalesCtrl = asyncHandler(async (req, res) => {
  const { salesId } = req.params;
  const { password, ...otherUpdates } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const validation = updateSalesSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const sales = await prisma.sales.findUnique({ where: { id: salesId } });

  if (!sales) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Sales not found",
    });
  }

  if (userRole === "SALES" && userId !== sales.id) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this account",
    });
  }

  if (userRole === "SUPERVISOR" && userId !== sales.supervisorId) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You can only update your own sales team members",
    });
  }

  let updatedData = { ...otherUpdates };

  if (password) {
    updatedData.password = await bcrypt.hash(password, 10);
  }

  const updatedSales = await prisma.sales.update({
    where: { id: salesId },
    data: updatedData,
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Sales account updated successfully",
    sales: updatedSales,
  });
});

/**
 * @method PUT
 * @route ~api/supervisor/request-email-update/:id
 * @desc Update sales email
 */
module.exports.requestEmailUpdateCtrl = asyncHandler(async (req, res) => {
  const { salesId } = req.params;
  const requestingUserId = req.user?.id;
  const requestingUserRole = req.user?.role;

  const validation = updateSalesEmail.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const { email } = validation.data;

  const sales = await prisma.sales.findUnique({ where: { id: salesId } });

  if (!sales) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Sales not found" });
  }

  if (sales.email === email) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "New email cannot be the same as current email",
    });
  }

  const isSelf = requestingUserId === salesId;
  const isSupervisor =
    requestingUserRole === "SUPERVISOR" &&
    sales.supervisorId === requestingUserId;
  const isSuperAdmin = requestingUserRole === "SUPER_ADMIN";

  if (!isSelf && !isSupervisor && !isSuperAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this sales person's email",
    });
  }

  const existingUser = await prisma.$transaction([
    prisma.superAdmin.findUnique({ where: { email } }),
    prisma.supervisor.findUnique({ where: { email } }),
    prisma.sales.findUnique({ where: { email } }),
    prisma.regularUser.findUnique({ where: { email } }),
  ]);

  if (existingUser.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Email already exists in another account",
    });
  }

  const token = jwt.sign(
    {
      id: salesId,
      email,
      role: "SALES",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { salesId },
        // Also clear any token that might exist for the new email
        {
          sales: {
            email: email,
          },
        },
      ],
    },
  });

  // Create new verification token
  await prisma.verificationToken.create({
    data: {
      token,
      userType: "SALES",
      sales: {
        connect: { id: salesId },
      },
    },
  });

  // Send verification email
  const verificationLink = `${process.env.BASE_URL}/api/supervisor/verify-email/${token}`;

  await sendEmail(
    email,
    "Verify Your New Email",
    `Click the link below to confirm your email change:\n\n${verificationLink}\n\nThis link will expire in 1 hour.`
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Verification email sent. Please check the new email inbox.",
    data: {
      email: email,
      expiresIn: "1 hour",
    },
  });
});

/**
 * @method PUT
 * @route ~api/supervisor/update/sales/phone/:id
 * @desc Update sales phone number
 */
module.exports.updateSalesPhoneCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phoneNumber } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  // Validate phone number input
  if (!phoneNumber) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number is required",
    });
  }

  const sales = await prisma.sales.findUnique({ where: { id } });

  if (!sales) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Sales not found",
    });
  }

  // Authorization checks
  if (userRole === "SALES" && userId !== sales.id) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this account",
    });
  }

  if (userRole === "SUPERVISOR" && userId !== sales.supervisorId) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You can only update your own sales team members",
    });
  }

  // Check if phone number exists in any user table
  const userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
  const phoneExists = await Promise.all(
    userTables.map(
      async (table) =>
        await prisma[table].findUnique({ where: { phoneNumber } })
    )
  );

  if (phoneExists.some((user) => user !== null && user.id !== id)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number already exists in another account",
    });
  }

  // Update phone number
  const updatedSales = await prisma.sales.update({
    where: { id },
    data: { phoneNumber },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Phone number updated successfully",
    sales: updatedSales,
  });
});

/**
 * @method PUT
 * @route ~api/supervisor/update/sales/profile-image/:id
 * @desc Update sales profile image
 */
module.exports.updateSalesProfileImageCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const sales = await prisma.sales.findUnique({ where: { id } });

  if (!sales) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Sales not found",
    });
  }

  if (userRole === "SALES" && userId !== sales.id) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this account",
    });
  }

  if (!req.file || !req.file.path) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "No image file uploaded",
    });
  }

  const uploadedData = await cloudinaryUploadingImage(req.file.path);
  const imagePath = path.join(
    __dirname,
    `../../../images/${req.file.filename}`
  );

  fs.unlinkSync(imagePath);

  if (!uploadedData.secure_url) {
    return res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Image upload failed",
    });
  }

  if (sales.profilePhoto?.publicId) {
    await cloudinaryUploadingImage(sales.profilePhoto.publicId, "delete");
  }

  const updatedSales = await prisma.sales.update({
    where: { id },
    data: {
      profilePhoto: {
        url: uploadedData.secure_url,
        publicId: uploadedData.public_id,
      },
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Profile image updated successfully",
    profilePhoto: updatedSales.profilePhoto,
  });
});

/**
 * @method GET
 * @route ~api/supervisor/verify-email/:token
 * @desc Verify Sales Email
 */
module.exports.verifyEmailUpdateCtrl = asyncHandler(async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, email } = decoded;

    if (!id || !email) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Invalid or expired token",
      });
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verification) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Invalid or expired token",
      });
    }

    const userRoles = {
      SUPER_ADMIN: prisma.superAdmin,
      SUPERVISOR: prisma.supervisor,
      SALES: prisma.sales,
      REGULAR_USER: prisma.regularUser,
    };

    const userModel = userRoles[verification.userType];

    if (!userModel) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Invalid user role",
      });
    }

    await userModel.update({
      where: { id },
      data: { email },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Email updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Invalid or expired token",
    });
  }
});

/**
 * @method GET
 * @route ~api/supervisor/get/sales/:userId
 * @desc Get user profile (Only User himself or Supervisor or Super Admin)
 */
module.exports.getSalesProfileCtrl = asyncHandler(async (req, res) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Invalid request: Sales ID is required",
    });
  }

  const sales = await prisma.sales.findUnique({
    where: { id },
  });

  if (!sales) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Sales not found" });
  }

  if (userRole === "SALES" && id !== sales.id) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to view this profile",
    });
  }

  if (userRole === "SUPERVISOR" && userId !== sales.supervisorId) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You can only view your own sales team members",
    });
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    sales,
  });
});

/**
 * @method GET
 * @route ~api/supervisor/get/all-sales/
 * @desc Get all sales (Only Supervisor or Super Admin)
 */
module.exports.getAllSalesCtrl = asyncHandler(async (req, res) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;

  let salesUsers;

  if (userRole === "SUPER_ADMIN") {
    salesUsers = await prisma.sales.findMany();
  } else if (userRole === "SUPERVISOR") {
    salesUsers = await prisma.sales.findMany({
      where: { supervisorId: userId },
    });
  } else {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You do not have permission to view Sales accounts",
    });
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    sales: salesUsers,
  });
});

/**
 * @method DELETE
 * @route ~api/supervisor/delete/sales/:id
 * @desc Delete Sales (Only Supervisor or Super Admin)
 */
module.exports.deleteSalesCtrl = asyncHandler(async (req, res) => {
  const { id: userId, role: userRole } = req.user;
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, message: "Sales id is required" });
  }

  const sales = await prisma.sales.findUnique({ where: { id } });

  if (!sales) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Sales not found" });
  }

  if (userRole === "SUPER_ADMIN") {
    await prisma.sales.delete({ where: { id } });
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Sales account deleted successfully ",
    });
  }

  if (userRole === "SUPERVISOR") {
    if (sales.supervisorId !== userId) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "You can only delete Sales users assigned to you",
      });
    }
    await prisma.sales.delete({ where: { id } });
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Sales account deleted successfully",
    });
  }

  return res.status(403).json({
    status: httpStatusText.FAIL,
    message: "You do not have permission to delete this Sales account",
  });
});
