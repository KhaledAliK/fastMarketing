const asyncHandler = require("express-async-handler");
const prisma = require("../../config/prisma");
const httpStatusText = require("../../utils/httpStatusText");
const sendEmail = require("../../utils/sendEmail");
const admin = require("../../config/firebaseAdmin");
const {
  cloudinaryUploadingImage,
  cloudinaryDeletingImage,
} = require("../../utils/cloudinary");
const {
  cloudinaryUploadingVideo,
  cloudinaryDeletingVideo,
} = require("../../utils/cloudinaryVideo");
const fs = require("fs");
const { promisify } = require("util");
const {
  notificationSchema,
} = require("../../utils/userNotificationValidation");
const unlinkFile = promisify(fs.unlink);

/**
 * @method POST
 * @route ~api/notification/send-user-notification
 * @desc Send notification to users (Only Super Admin)
 */
module.exports.sendTextNotificationCtrl = asyncHandler(async (req, res) => {
  const { title, body, audience } = req.body;
  if (!title || !body || !audience) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message: "Missing required fields",
    });
  }
  const newNotification = await prisma.userNotification.create({
    data: {
      message: body,
      type: "TEXT",
      audience,
    },
  });
  let users = [];
  if (audience === "ALL") {
    const regularUsers = await prisma.regularUser.findMany();
    const subscriptionUsers = await prisma.userSubscription.findMany();
    users = [
      ...regularUsers.map((u) => ({ id: u.id, type: "regular" })),
      ...subscriptionUsers.map((u) => ({ id: u.id, type: "subscription" })),
    ];
  } else if (audience === "REGULAR_USER") {
    const regularUsers = await prisma.regularUser.findMany();
    users = regularUsers.map((u) => ({ id: u.id, type: "regular" }));
  } else if (audience === "USER_SUBSCRIPTION") {
    const subscribedUsers = await prisma.userSubscription.findMany();
    users = subscribedUsers.map((u) => ({ id: u.id, type: "subscription" }));
  }
  const records = users.map((user) => ({
    notificationId: newNotification.id,
    regularUserId: user.type === "regular" ? user.id : null,
    userSubscriptionId: user.type === "subscription" ? user.id : null,
  }));

  await prisma.userNotificationRecord.createMany({ data: records });
  const topic =
    audience === "ALL"
      ? "all_users"
      : audience === "REGULAR_USER"
      ? "user_not_subscribed"
      : "user_subscribed";

  const message = {
    notification: { title, body },
    topic,
  };

  try {
    const firebaseResponse = await admin.messaging().send(message);
    return res.status(200).json({
      message: "✅ Notification sent successfully",
      firebaseResponse,
      notificationId: newNotification.id,
    });
  } catch (error) {
    console.error("❌ Firebase Error:", error);
    return res.status(500).json({
      status: httpStatusText.FAIL,
      message: "❌ Failed to send notification via Firebase",
      error: error.message || error,
    });
  }
});

/**
 * @method POST
 * @route ~api/notification/send-media-notification
 * @desc Send notification to users (Only Super Admin)
 */
module.exports.sendMediaNotificationCtrl = asyncHandler(async (req, res) => {
  const { title, body, audience } = req.body;
  const { mediaType } = req.query;

  const validation = notificationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      error: validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }
  if (!mediaType) {
    return res
      .status(400)
      .json({ status: httpStatusText.FAIL, message: "Media type is required" });
  }

  let uploadFile;
  let publicId;
  if (mediaType === "image") {
    uploadFile = await cloudinaryUploadingImage(req.file.path);
    publicId = uploadFile.public_id;
  } else if (mediaType === "video") {
    uploadFile = await cloudinaryUploadingVideo(req.file.path);
    publicId = uploadFile.public_id;
  }

  const mediaUrl = uploadFile.secure_url;

  try {
    await unlinkFile(req.file.path);
  } catch (error) {
    console.error("❌ Error deleting local file:", error);
  }

  const newNotification = await prisma.userNotification.create({
    data: {
      message: body,
      type: mediaType.toUpperCase(),
      audience,
      ...(mediaType === "image" && { imageUrl: mediaUrl }),
      ...(mediaType === "video" && { videoUrl: mediaUrl }),
    },
  });

  let users = [];
  if (audience === "ALL") {
    const regularUsers = await prisma.regularUser.findMany();
    const subscriptionUsers = await prisma.userSubscription.findMany();
    users = [
      ...regularUsers.map((u) => ({ id: u.id, type: "regular" })),
      ...subscriptionUsers.map((u) => ({ id: u.id, type: "subscription" })),
    ];
  } else if (audience === "REGULAR_USER") {
    const regularUsers = await prisma.regularUser.findMany();
    users = regularUsers.map((u) => ({ id: u.id, type: "regular" }));
  } else if (audience === "USER_SUBSCRIPTION") {
    const subscribedUsers = await prisma.userSubscription.findMany();
    users = subscribedUsers.map((u) => ({ id: u.id, type: "subscription" }));
  }

  const records = users.map((user) => ({
    notificationId: newNotification.id,
    regularUserId: user.type === "regular" ? user.id : null,
    userSubscriptionId: user.type === "subscription" ? user.id : null,
  }));

  await prisma.userNotificationRecord.createMany({ data: records });

  const topic =
    audience === "ALL"
      ? "all_users"
      : audience === "REGULAR_USER"
      ? "user_not_subscribed"
      : "user_subscribed";

  const message = {
    notification: {
      title,
      body,
      ...(mediaType === "image" && { image: mediaUrl }),
    },
    topic,
    ...(mediaType === "video" && { data: { videoUrl: mediaUrl } }),
  };

  const firebaseResponse = await admin.messaging().send(message);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "✅ Media Notification sent successfully",
    firebaseResponse,
    notificationId: newNotification.id,
  });
});

/**
 * @method GET
 * @route ~api/notification/get-user-notifications
 * @desc Get all notifications
 */
module.exports.getNotificationForUserCtrl = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Step 1: Check if the user is a subscription user
  const subscriptionUser = await prisma.userSubscription.findUnique({
    where: { id: userId },
  });

  // Step 2: Check if the user is a regular user
  const regularUser = await prisma.regularUser.findUnique({
    where: { id: userId },
  });

  if (!regularUser && !subscriptionUser) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "User not found" });
  }

  const isSubscription = Boolean(subscriptionUser);

  // Get only the user-specific notifications (from userNotificationRecord)
  const userRecords = await prisma.userNotificationRecord.findMany({
    where: isSubscription
      ? { userSubscriptionId: userId }
      : { regularUserId: userId },
    include: { notification: true },
  });

  // Format the response
  const notifications = userRecords.map((rec) => ({
    id: rec.notification.id,
    message: rec.notification.message,
    type: rec.notification.type,
    audience: rec.notification.audience,
    imageUrl: rec.notification.imageUrl || null,
    videoUrl: rec.notification.videoUrl || null,
    isRead: rec.isRead,
    isDeleted: rec.isDeleted,
    createdAt: rec.notification.createdAt,
  }));

  // Sort notifications by the most recent
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    count: notifications.length,
    data: notifications,
  });
});

/**
 * @method DELETE
 * @route ~api/notification/delete-user-notification/:userId/:notificationId
 * @desc Delete a user's specific notification (Regular User or Subscription User)
 */
module.exports.deleteUserNotificationCtrl = asyncHandler(async (req, res) => {
  const { userId, notificationId } = req.params;

  const notification = await prisma.userNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return res
      .status(404)
      .json({ status: httpStatusText.FAIL, message: "Notification not found" });
  }

  const userRecord = await prisma.userNotificationRecord.findFirst({
    where: {
      notificationId,
      OR: [{ regularUserId: userId }, { userSubscriptionId: userId }],
    },
  });

  if (!userRecord) {
    return res.status(403).json({
      status: httpStatusText.FAIL,
      message: "You don't have access to delete this notification",
    });
  }

  await prisma.userNotificationRecord.delete({
    where: { id: userRecord.id },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Notification removed for this user only",
  });
});

/**
 * @method DELETE
 * @route ~api/notification/delete-all-user-notifications/:userId
 * @desc Delete all notifications for a specific user (Regular User or Subscription User)
 */
module.exports.deleteAllUserNotificationsCtrl = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;

    const subscriptionUser = await prisma.userSubscription.findUnique({
      where: { id: userId },
    });

    const regularUser = await prisma.regularUser.findUnique({
      where: { id: userId },
    });

    if (subscriptionUser) {
      await prisma.userNotificationRecord.deleteMany({
        where: { userSubscriptionId: userId },
      });

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "✅ All notifications for this user have been deleted",
      });
    } else if (regularUser) {
      await prisma.userNotificationRecord.deleteMany({
        where: { regularUserId: userId },
      });
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "✅ All notifications for this user have been deleted",
      });
    } else {
      return res.status(404).json({
        status: httpStatusText.FAIL,
        message: "User not found",
      });
    }
  }
);
