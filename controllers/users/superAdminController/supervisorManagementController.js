const asyncHandler = require("express-async-handler");
const {
  supervisorSchema,
  loginSupervisorSchema,
  updateSupervisorSchema,
  updateSupervisorEmail,
} = require("../../../utils/supervisorValidation");
const httpStatusText = require("../../../utils/httpStatusText");
const sendEmail = require("../../../utils/sendEmail");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../../config/prisma");
const { cloudinaryUploadingImage } = require("../../../utils/cloudinary");
const path = require("path");
const fs = require("fs");

/**
 * @method POST
 * @route ~api/super-admin/create/supervisor
 * @desc Create supervisor (Only Super Admin)
 */
module.exports.createSupervisorCtrl = asyncHandler(async (req, res) => {
  const validation = supervisorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      errors: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const { firstName, middleName, lastName, email, password, phoneNumber } =
    req.body;
  const userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
  const existingUser = await Promise.all(
    userTables.map(async (table) => {
      return prisma[table].findUnique({ where: { email } });
    })
  );
  if (existingUser.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Email already exists in another account",
    });
  }
  const existingPhone = await Promise.all(
    userTables.map(async (table) => {
      return prisma[table].findUnique({ where: { phoneNumber } });
    })
  );
  if (existingPhone.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number already exists in another account",
    });
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

    const imagePath = path.join(
      __dirname,
      `../../../images/${req.file.filename}`
    );
    fs.unlinkSync(imagePath);
    const newSupervisor = await prisma.supervisor.create({
      data: {
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        verified: false,
        profilePhoto,
      },
    });
    const token = jwt.sign(
      { userId: newSupervisor.id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
    await prisma.verificationToken.create({
      data: {
        token,
        userType: "SUPERVISOR",
        supervisorId: newSupervisor.id,
      },
    });
    const verificationLink = `${process.env.BASE_URL}/api/user/verify/${newSupervisor.id}/${token}`;
    await sendEmail(
      newSupervisor.email,
      "Verify Your Email",
      `Hello ${newSupervisor.firstName},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 7 days.`
    );
    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message:
        "Supervisor created successfully. Please check your email to verify your account.",
      supervisor: newSupervisor,
    });
  }
});

/**
 * @method POST
 * @route ~api/super-admin/login/supervisor
 * @desc Create supervisor (Only Super Admin)
 */
module.exports.loginSupervisorCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const validation = loginSupervisorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      errors: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const user = await prisma.supervisor.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  } else if (!user.verified) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Your account not verified",
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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
 * @route ~api/super-admin/update/supervisor/:id
 * @desc Update supervisor account (Only Super Admin && Supervisor Himself)
 */
module.exports.updateSupervisorCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const validation = updateSupervisorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const supervisor = await prisma.supervisor.findUnique({
    where: { id },
  });

  if (!supervisor) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Supervisor not found" });
  }

  const isSelfUpdate = userId === supervisor.id;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  if (!isSelfUpdate && !isSuperAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this account",
    });
  }

  const { email, password, phoneNumber } = req.body;

  if (email) {
    const userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
    const emailExists = await Promise.all(
      userTables.map(async (table) => {
        return prisma[table].findUnique({ where: { email } });
      })
    );

    if (emailExists.some((user) => user !== null && user.id !== id)) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Email already exists in another account",
      });
    }
  }

  if (phoneNumber) {
    const userTables = ["superAdmin", "supervisor", "sales", "regularUser"];
    const phoneExists = await Promise.all(
      userTables.map(async (table) => {
        return prisma[table].findUnique({ where: { phoneNumber } });
      })
    );

    if (phoneExists.some((user) => user !== null && user.id !== id)) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Phone number already exists in another account",
      });
    }
  }

  let updatedData = { ...req.body };

  if (password) {
    updatedData.password = await bcrypt.hash(password, 10);
  }

  const updatedSupervisor = await prisma.supervisor.update({
    where: { id },
    data: updatedData,
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Supervisor account updated successfully",
    supervisor: updatedSupervisor,
  });
});

/**
 * @method DELETE
 * @route ~api/super-admin/delete/supervisor/:id
 * @desc Delete supervisor account (Only Super Admin && Supervisor Himself)
 */
module.exports.deleteSupervisorCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const supervisor = await prisma.supervisor.findUnique({ where: { id } });
  if (!supervisor) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Supervisor not found" });
  }
  const isSelfDelete = userId === supervisor.id;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  if (!isSelfDelete && !isSuperAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to delete this account",
    });
  }

  await prisma.supervisor.delete({
    where: { id },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Supervisor account deleted successfully",
  });
});

/**
 * @method GET
 * @route ~api/super-admin/get/supervisor/:id
 * @desc Get supervisor profile (Only Super Admin or Supervisor Himself)
 */
module.exports.getSupervisorAccountCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supervisor = await prisma.supervisor.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      password: true,
      role: true,
      country: true,
      city: true,
      profilePhoto: true,
      phoneNumber: true,
      bankName: true,
      bankAccountNumber: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      referrals: true,
      sales: true,
      verificationToken: true,
      _count: true,
    },
  });
  if (!supervisor) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Supervisor not found" });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: supervisor });
});

/**
 * @method GET
 * @route ~api/super-admin/get/all-supervisors
 * @desc Get all supervisors (Only Super Admin)
 */
module.exports.getAllSupervisorsCtrl = asyncHandler(async (req, res) => {
  const supervisors = await prisma.supervisor.findMany({
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      role: true,
      country: true,
      city: true,
      profilePhoto: true,
      phoneNumber: true,
      bankName: true,
      bankAccountNumber: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      referrals: true,
      sales: true,
      verificationToken: true,
      _count: true,
    },
  });
  if (!supervisors) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "No supervisor exist" });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: supervisors });
});

/**
 * @method GET
 * @route ~api/super-admin/get-supervisor/:id/sales
 * @desc Get all sales for a specific supervisor (Only Super Admin or Supervisor Himself)
 */
module.exports.getSalesForSupervisorCtrl = asyncHandler(async(req, res) => {
  const { id } = req.params;
  const userId  = req.user?.id;
  const userRole = req.user?.role;

  const supervisor = await prisma.supervisor.findUnique({ where: { id }, include: {
    sales: true
  }});
  if(!supervisor) {
    return res.status(404).json({ status: httpStatusText.FAIL, message: "Supervisor not found"});
  }
  
  const isSelfAccess = userId === supervisor.id;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  if(!isSelfAccess && !isSuperAdmin) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to access these sales",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: supervisor.sales})

});
