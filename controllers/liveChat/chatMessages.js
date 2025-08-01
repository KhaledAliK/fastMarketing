const prisma = require("../../config/prisma");
const cloudinaryConfig = require("../../config/cloudinaryConfig");
const httpStatusText = require("../../utils/httpStatusText");
const asyncHandler = require("express-async-handler");

const registerSocketUser = async (userId, socket, onLineUsers) => {
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: userId },
    });

    const regularUser = await prisma.regularUser.findUnique({
      where: { id: userId },
    });

    if (superAdmin || regularUser) {
      onLineUsers.set(userId, socket.id);
      console.log("✅ Registered:", userId);
    } else {
      console.log("❌ User not found in system.");
      socket.disconnect(true);
    }
  } catch (err) {
    console.error("❌ Error during register:", err);
    socket.disconnect(true);
  }
};

const handleSendMessage = async (socket, data, onLineUsers, callback) => {
  const { senderId, senderRole, receiverId, receiverRole, text, fileBase64 } =
    data;

  let mediaUrl = null;
  let mediaType = null;

  if (fileBase64) {
    const uploadResult = await cloudinaryConfig.uploader.upload(fileBase64, {
      folder: "chat_uploads",
      resource_type: "auto",
    });

    mediaUrl = uploadResult.secure_url;
    mediaType = uploadResult.resource_type;
  }

  const messageData = {
    senderRole,
    receiverRole,
    text,
    mediaUrl,
    mediaType,
    createdAt: new Date(),
    isRead: false,
  };

  if (senderRole === "REGULAR_USER") {
    messageData.senderRegularUserId = senderId;
  } else if (senderRole === "SUPER_ADMIN") {
    messageData.senderSuperAdminId = senderId;
  }

  if (receiverRole === "REGULAR_USER") {
    messageData.receiverRegularUserId = receiverId;
  }

  const savedMessage = await prisma.chatMessage.create({
    data: messageData,
  });

  if (senderRole === "REGULAR_USER") {
    for (const [userId, socketId] of onLineUsers.entries()) {
      const isAdmin = await prisma.superAdmin.findUnique({
        where: { id: userId },
      });

      if (socketId && isAdmin) {
        socket.to(socketId).emit("receive_message", savedMessage);
      }
    }
  } else if (senderRole === "SUPER_ADMIN" && receiverId) {
    const userSocketId = onLineUsers.get(receiverId);
    if (userSocketId) {
      socket.to(userSocketId).emit("receive_message", savedMessage);
    }
  }

  socket.emit("receive_message", savedMessage);

  if (typeof callback === "function") {
    callback(savedMessage);
  }
};

const getUnreadMessagesGroupedByUser = async () => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      senderRole: "REGULAR_USER",
      receiverRole: "SUPER_ADMIN",
      isRead: false,
    },
    select: {
      senderRegularUserId: true,
    },
  });

  const uniqueUserIds = [
    ...new Set(messages.map((msg) => msg.senderRegularUserId).filter(Boolean)),
  ];

  const result = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const user = await prisma.regularUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          profilePhoto: true,
          role: true,
        },
      });

      const count = await prisma.chatMessage.count({
        where: {
          senderRegularUserId: userId,
          senderRole: "REGULAR_USER",
          receiverRole: "SUPER_ADMIN",
          isRead: false,
        },
      });

      return {
        user,
        unreadCount: count,
      };
    })
  );

  return result;
};

const handleMarkMessagesAsRead = async (socket, data) => {
  const { senderId, receiverId, senderRole, receiverRole } = data;

  const whereCondition = {
    isRead: false,
    ...(senderRole === "REGULAR_USER"
      ? { senderRegularUserId: senderId }
      : { senderSuperAdminId: senderId }),

    // هنا فيه تعديل مهم:
    ...(receiverRole === "REGULAR_USER"
      ? { receiverRegularUserId: receiverId }
      : {}), // SuperAdmin ملوش عمود مستقبل
  };

  try {
    await prisma.chatMessage.updateMany({
      where: whereCondition,
      data: {
        isRead: true,
      },
    });

    socket.emit("messages_marked_as_read", { success: true });
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
  }
};

const handleFetchChatMessages = async (socket, data) => {
  const { regularUserId } = data;

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        senderRole: { in: ["REGULAR_USER", "SUPER_ADMIN"] },
        receiverRole: { in: ["REGULAR_USER", "SUPER_ADMIN"] },
        OR: [
          { senderRegularUserId: regularUserId },
          { receiverRegularUserId: regularUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    socket.emit("chat_messages_with_user", messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    socket.emit("chat_messages_with_user", []);
  }
};

const handleGetSendersForAdmin = async (socket) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        receiverRole: "SUPER_ADMIN",
        senderRole: "REGULAR_USER",
      },
      distinct: ["senderRegularUserId"],
      orderBy: {
        createdAt: "desc",
      },
      select: {
        senderRegularUserId: true,
      },
    });

    const senderIds = messages
      .map((msg) => msg.senderRegularUserId)
      .filter(Boolean);

    const uniqueUserIds = [...new Set(senderIds)];

    const usersWithCounts = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const user = await prisma.regularUser.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            profilePhoto: true,
            email: true,
            role: true,
          },
        });

        const unreadCount = await prisma.chatMessage.count({
          where: {
            senderRegularUserId: userId,
            senderRole: "REGULAR_USER",
            receiverRole: "SUPER_ADMIN",
            isRead: false,
          },
        });

        return { ...user, unreadCount };
      })
    );

    socket.emit("senders_for_admin", usersWithCounts);
  } catch (error) {
    console.error("❌ Error fetching senders for admin:", error);
    socket.emit("senders_for_admin", []);
  }
};

/**
 * @method GET
 * @route ~api/chat-messages/get-messages/:senderId/:receiverId
 * @desc Get all chat messages between the sender and the receiver
 */
const getUserChatMessagesCtrl = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params;
  const { senderRole, receiverRole } = req.query;

  if (!senderId || !receiverId || !senderRole || !receiverRole) {
    return res.status(400).json({
      status: httpStatusText.FAIL,
      message:
        "senderId, receiverId, senderRole, and receiverRole are required.",
    });
  }

  const whereCondition = {
    OR: [
      {
        ...(senderRole === "REGULAR_USER"
          ? { senderRegularUserId: senderId }
          : { senderSuperAdminId: senderId }),
        ...(receiverRole === "REGULAR_USER"
          ? { receiverRegularUserId: receiverId }
          : { receiverSuperAdminId: receiverId }),
      },
      {
        ...(senderRole === "REGULAR_USER"
          ? { senderRegularUserId: receiverId }
          : { senderSuperAdminId: receiverId }),
        ...(receiverRole === "REGULAR_USER"
          ? { receiverRegularUserId: senderId }
          : { receiverSuperAdminId: senderId }),
      },
    ],
  };

  const messages = await prisma.chatMessage.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "asc",
    },
  });

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    messages,
  });
});

/**
 * @method GET
 * @route ~api/chat-messages/get-suggested-users
 * @desc Get users for chat with super admin
 */
const getSuggestedUsersCtrl = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const recentSenders = await prisma.chatMessage.findMany({
    where: {
      receiverSuperAdminId: adminId,
      senderRole: "REGULAR_USER",
    },
    distinct: ["senderRegularUserId"],
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      senderRegularUserId: true,
    },
  });

  const senderIds = recentSenders
    .map((s) => s.senderRegularUserId)
    .filter(Boolean);

  const users = await Promise.all(
    senderIds.map(async (userId) => {
      const user = await prisma.regularUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          profilePhoto: true,
          role: true,
        },
      });

      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderRegularUserId: userId,
          receiverSuperAdminId: adminId,
          isRead: false,
        },
      });

      return {
        ...user,
        unreadCount,
      };
    })
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    users,
  });
});

module.exports = {
  registerSocketUser,
  handleSendMessage,
  getUserChatMessagesCtrl,
  getSuggestedUsersCtrl,
  handleMarkMessagesAsRead,
  getUnreadMessagesGroupedByUser,
  handleFetchChatMessages,
  handleGetSendersForAdmin,
};


