const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const httpStatusText = require("../../../utils/httpStatusText");
const {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserEmail,
} = require("../../../utils/validationSchemas");
require("dotenv").config();
const sendEmail = require("../../../utils/sendEmail");
const {
  cloudinaryUploadingImage,
  cloudinaryDeletingImage,
} = require("../../../utils/cloudinary");
const fs = require("fs");
const path = require("path");

const prisma = require("../../../config/prisma");
const { BASE_URL } = require("../../../utils/envMode");

/**
 *@method POST
 *@route ~api/user/regular-user/register
 *@desc Register user (Regular User)
 */
module.exports.registerRegularUserCtrl = asyncHandler(async (req, res) => {
  const validation = await registerSchema.safeParseAsync(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: validation.error.errors[0].message,
    });
  }

  const { email, password, phoneNumber } = req.body;

  const existingUsers = await prisma.$transaction([
    prisma.superAdmin.findUnique({ where: { email } }),
    prisma.superAdmin.findUnique({ where: { phoneNumber } }),
    prisma.supervisor.findUnique({ where: { email } }),
    prisma.supervisor.findUnique({ where: { phoneNumber } }),
    prisma.sales.findUnique({ where: { email } }),
    prisma.sales.findUnique({ where: { phoneNumber } }),
    prisma.regularUser.findUnique({ where: { email } }),
    prisma.regularUser.findUnique({ where: { phoneNumber } }),
  ]);

  if (existingUsers.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Email or phone number already registered",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

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

  let imagePath;
  if (req.file && req.file.filename) {
    imagePath = path.join(__dirname, `../../../images/${req.file.filename}`);
  }

  const newRegularUser = await prisma.$transaction(async (prisma) => {
    const user = await prisma.regularUser.create({
      data: {
        ...req.body,
        password: hashedPassword,
        verified: false,
        profilePhoto: profilePhoto,
      },
    });
    return user;
  });

  const token = jwt.sign(
    { id: newRegularUser.id, userType: "REGULAR_USER", email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  await prisma.verificationToken.create({
    data: {
      token,
      userType: "REGULAR_USER",
      regularUserId: newRegularUser.id,
    },
  });

  const verifyUrl = `${BASE_URL}/api/user/verify/${newRegularUser.id}/${token}`;
  await sendEmail(
    email,
    "Verify Your Email",
    `Click here to verify your email: ${verifyUrl}`
  );

  if (imagePath && fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message:
      "User registered successfully. Please check your email for verification.",
    newRegularUser,
  });
});

/**
 *@method POST
 *@route ~api/user/regular-user/login
 *@desc Login user (Regular User)
 */
module.exports.loginRegularUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const validation = await loginSchema.safeParseAsync(req.body);
  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: validation.error.errors[0].message,
    });
  }
  const [superAdmin, supervisor, sales, regularUser] =
    await prisma.$transaction([
      prisma.superAdmin.findUnique({ where: { email } }),
      prisma.supervisor.findUnique({ where: { email } }),
      prisma.sales.findUnique({ where: { email } }),
      prisma.regularUser.findUnique({ where: { email } }),
    ]);
  const user = superAdmin || supervisor || sales || regularUser;
  if (!user) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  } else if (!user.verified) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "This email is not verified",
    });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      status: httpStatusText.FAIL,
      message: "Invalid email or password",
    });
  }

  let userType = "REGULAR_USER";
  if (superAdmin) userType = "SUPER_ADMIN";
  else if (supervisor) userType = "SUPERVISOR";
  else if (sales) userType = "SALES";

  const token = jwt.sign(
    { id: user.id, email: user.email, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    token,
    message: "Login successfully",
    user,
  });
});

/**
 *@method PUT
 *@route ~api/user/regular-user/update/:id
 *@desc Update user account (Only User Himself)
 */
module.exports.updateRegularUserProfileCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password, phoneNumber, ...otherUpdates } = req.body;

  const user = await prisma.regularUser.findUnique({ where: { id } });

  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (req.user?.id !== user.id) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this account",
    });
  }

  const validation = await updateUserSchema.safeParseAsync({
    ...req.body,
    profilePhoto: req.file,
  });

  if (!validation.success) {
    return res.status(422).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  if (phoneNumber && phoneNumber !== user.phoneNumber) {
    const userExists = await prisma.$transaction([
      prisma.regularUser.findUnique({ where: { phoneNumber } }),
      prisma.superAdmin.findUnique({ where: { phoneNumber } }),
      prisma.supervisor.findUnique({ where: { phoneNumber } }),
      prisma.sales.findUnique({ where: { phoneNumber } }),
    ]);
    if (userExists.some((user) => user !== null)) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Phone number already exists in another account",
      });
    }
  }

  let updatedData = { ...otherUpdates };

  if (phoneNumber) updatedData.phoneNumber = phoneNumber;
  if (password) updatedData.password = await bcrypt.hash(password, 10);

  if (req.file) {
    const imagePath = path.join(
      __dirname,
      `../../../images/${req.file.filename}`
    );
    const uploadResult = await cloudinaryUploadingImage(imagePath);

    if (user.profilePhoto?.publicId) {
      await cloudinaryDeletingImage(user.profilePhoto.publicId);
    }

    updatedData.profilePhoto = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };

    fs.unlinkSync(imagePath);
  }

  const updatedUser = await prisma.regularUser.update({
    where: { id },
    data: updatedData,
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Your account updated successfully.",
    user: updatedUser,
  });
});

/**
 *@method PUT
 *@route ~api/user/regular-user/update/email/:id
 *@desc Update user account (Only User Himself)
 */
module.exports.updateRegularUserEmailCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const validation = updateUserEmail.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const user = await prisma.regularUser.findUnique({ where: { id } });
  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (req.user?.id !== user.id && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to update this email",
    });
  }

  const emailExists = await prisma.$transaction([
    prisma.regularUser.findUnique({ where: { email } }),
    prisma.superAdmin.findUnique({ where: { email } }),
    prisma.supervisor.findUnique({ where: { email } }),
    prisma.sales.findUnique({ where: { email } }),
  ]);

  if (emailExists.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Email is already registered with another account",
    });
  }

  const token = jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  await prisma.verificationToken.create({
    data: {
      token,
      userType: "REGULAR_USER",
      regularUser: { connect: { id: user.id } },
    },
  });

  const verificationUrl = `${BASE_URL}/api/user/regular-user/verify-email/${token}`;

  await sendEmail(
    email,
    "Verify Your New Email",
    `Click the link below to confirm your email change:\n\n${verificationUrl}\n\nThis link will expire in 1 hour.`
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Verification email sent. Please check your inbox to confirm.",
  });
});

/**
 *@method GET
 *@route ~api/user/regular-user/verify-email/:token
 *@desc Verify User Email
 */
module.exports.verifyUpdatedEmailCtrl = asyncHandler(async (req, res) => {
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
 *@method PUT
 *@route ~api/user/regular-user/change-password/:id
 *@desc Change Password by user himself
 */
module.exports.changeUserPasswordCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await prisma.regularUser.findUnique({ where: { id } });
  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (req.user?.id !== user.id) {
    return res
      .status(403)
      .json({
        status: httpStatusText.FAIL,
        message: "You are not authorized to update this account",
      });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Current password is incorrect",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "New password and confirmation do not match",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.regularUser.update({
    where: { id },
    data: { password: hashedPassword },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Password updated successfully",
  });
});

/**
 *@method GET
 *@route ~api/user/regular-user/get-profile/:id
 *@desc Get User Profile
 */
module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.regularUser.findUnique({ where: { id } });

  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (
    !req.user ||
    (req.user?.id !== user.id && req.user?.role !== "SUPER_ADMIN")
  ) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to get this profile",
    });
  }

  return res.status(200).json({ status: httpStatusText.SUCCESS, data: user });
});

/**
 *@method GET
 *@route ~api/user/regular-user/get-regular-user-count
 *@desc Get number of regular user
 */
module.exports.getTheNumberOfUsersCtrl = asyncHandler(async (req, res) => {
  const regularUsersCount = await prisma.regularUser.count();
  if (!regularUsersCount) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There are no users" });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, count: regularUsersCount });
});

/**
 *@method DELETE
 *@route ~api/user/regular-user/delete-profile/:id
 *@desc Delete User Profile (Only Himself or Super Admin)
 */
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.regularUser.findUnique({ where: { id } });
  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (
    !req.user ||
    (req.user?.id !== user.id && req.user?.role !== "SUPER_ADMIN")
  ) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You are not authorized to delete this account",
    });
  }

  await prisma.regularUser.delete({ where: { id } });
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message:
      req.user.id === user.id
        ? "Your account has been deleted successfully"
        : `User ${user.id} has been deleted by Super Admin`,
  });
});

/**
 *@method GET
 *@route ~api/user/regular-user/get-all-regular-user
 *@desc Delete User Profile (Only Himself or Super Admin)
 */
module.exports.getAllRegularUserCtrl = asyncHandler(async (req, res) => {
  const regularUsers = await prisma.regularUser.findMany();
  if (!regularUsers) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not regular users",
    });
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: regularUsers });
});

/**
 *@method GET
 *@route ~api/user/regular-user/get-all-users
 *@desc Delete User Profile (Only Himself or Super Admin)
 */
module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const allUsers = await prisma.regularUser.findMany({
    include: {
      subscriptions: {
        include: {
          package: true,
        },
      },
    },
  });

  if (!allUsers) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "There are no users" });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: allUsers });
});

/**
 *@method GET
 *@route ~api/user/regular-user/get-all-subscribed-users
 *@desc Delete User Profile (Only Himself or Super Admin)
 */
module.exports.getAllSubscribedUsersCtrl = asyncHandler(async (req, res) => {
  const subscribedUsers = await prisma.userSubscription.findMany({
    include: {
      user: true,
      package: true,
    },
  });

  if (!subscribedUsers) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "There are not subscribed users",
    });
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: subscribedUsers });
});

/**
 *@method GET
 *@route ~api/user/regular-user/non-subscribed
 *@desc Get all non-subscribed regular users
 */
module.exports.getNonSubscribedUsersCtrl = asyncHandler(async (req, res) => {
  const nonSubscribedUsers = await prisma.regularUser.findMany({
    where: {
      subscriptions: {
        none: {},
      },
    },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: nonSubscribedUsers.length,
    users: nonSubscribedUsers,
  });
});

/**
 * @method GET
 * @route ~api/user/profile/:id
 * @desc Get user profile from either RegularUser or UserSubscription
 */
module.exports.getUsersProfileCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const regularUser = await prisma.regularUser.findUnique({
    where: { id },
    include: {
      diamondWalletSubscriptions: true,
      subscriptions: {
        where: { isActive: true },
        orderBy: { startDate: "desc" },
        take: 1,
        include: { package: true },
      },
    },
  });

  if (regularUser) {
    const subscription = regularUser.subscriptions[0];
    let remainingDays = null;
    let startDate = null;
    let endDate = null;

    if (subscription) {
      startDate = subscription.startDate;
      endDate = subscription.endDate;

      const now = new Date();
      const diffTime = new Date(endDate).getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const isSubscribed = !!subscription?.packageId;

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "User profile",
      user: regularUser,
      isSubscribed,
      subscription: subscription
        ? {
            packageName: subscription.package?.name,
            startDate,
            endDate,
            remainingDays,
          }
        : null,
    });
  }

  // fallback in case userSubscription exists but RegularUser is not found
  const userSubscription = await prisma.userSubscription.findFirst({
    where: { userId: id },
    orderBy: { startDate: "desc" },
    take: 1,
    include: {
      diamondWalletSubscriptions: true,
      user: true,
      package: true,
    },
  });

  if (userSubscription) {
    const startDate = userSubscription.startDate;
    const endDate = userSubscription.endDate;
    const now = new Date();
    const diffTime = new Date(endDate).getTime() - now.getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    );

    const isSubscribed = !!userSubscription.packageId;

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "User profile",
      user: userSubscription.user,
      subscription: {
        packageName: userSubscription.package?.name,
        startDate,
        endDate,
        remainingDays,
      },
      isSubscribed,
    });
  }

  return res.status(404).json({
    status: httpStatusText.FAIL,
    message: "User not found in either RegularUser or UserSubscription.",
  });
});

/**
 * @method PUT
 * @route ~api/user/update-profile/:id
 * @desc Update user profile (Only Super Admin)
 */
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    firstName,
    middleName,
    lastName,
    bankName,
    bankAccountNumber,
    city,
    country,
    diamondWalletSubscriptions,
    subscriptions,
  } = req.body;

  const regularUser = await prisma.regularUser.findUnique({ where: { id } });
  if (!regularUser) {
    return res.status(404).json({
      status: httpStatusText.FAIL,
      message: "Regular user not found",
    });
  }

  const updateData = {
    firstName,
    middleName,
    lastName,
    bankName,
    bankAccountNumber,
    city,
    country,
  };

  if (diamondWalletSubscriptions?.id) {
    const wallet = await prisma.diamondWalletSubscription.findUnique({
      where: { id: diamondWalletSubscriptions.id },
    });

    if (!wallet || wallet.userId !== id) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "This diamond wallet does not belong to this user.",
      });
    }

    updateData.diamondWalletSubscriptions = {
      update: {
        where: { id: diamondWalletSubscriptions.id },
        data: {
          diamondCount: diamondWalletSubscriptions.diamondCount,
        },
      },
    };
  }

  if (subscriptions?.id) {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptions.id },
    });

    if (!subscription) {
      return res.status(403).json({
        status: httpStatusText.FAIL,
        message: "This subscription does not belong to this user.",
      });
    }

    updateData.subscriptions = {
      update: {
        where: { id: subscriptions.id },
        data: {
          packageId: subscriptions.packageId,
        },
      },
    };
  }

  const updatedRegularUser = await prisma.regularUser.update({
    where: { id },
    data: updateData,
    include: {
      diamondWalletSubscriptions: true,
      subscriptions: true,
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Regular user updated successfully",
    user: updatedRegularUser,
  });
});

/**
 *@method PUT
 *@route ~api/user/update-phone-number/:id
 *@desc Update user phone number (Only Super Admin)
 */
module.exports.updatePhoneNumberCtrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phoneNumber } = req.body;

  const user = await prisma.regularUser.findUnique({ where: { id } });

  if (!user) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  if (!phoneNumber) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number is required",
    });
  }

  const existingPhoneNumber = await prisma.$transaction([
    prisma.regularUser.findUnique({ where: { phoneNumber } }),
    prisma.sales.findUnique({ where: { phoneNumber } }),
    prisma.supervisor.findUnique({ where: { phoneNumber } }),
    prisma.superAdmin.findUnique({ where: { phoneNumber } }),
  ]);

  if (existingPhoneNumber.some((user) => user !== null)) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Phone number already exists in another account",
    });
  }

  const updatedUser = await prisma.regularUser.update({
    where: { id },
    data: { phoneNumber },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Phone number updated successfully",
    updatedUser,
  });
});


