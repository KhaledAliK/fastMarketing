const { Server } = require("socket.io");
const {
  handleSendMessage,
  handleMarkMessagesAsRead,
  registerSocketUser,
  getUnreadMessagesGroupedByUser,
  handleFetchChatMessages,
  handleGetSendersForAdmin,
} = require("../controllers/liveChat/chatMessages");
const prisma = require("../config/prisma");

const sendUnreadCountsToAdmins = async (io, onLineUsers) => {
  try {
    const data = await getUnreadMessagesGroupedByUser();

    for (const [userId, socketId] of onLineUsers.entries()) {
      const isAdmin = await prisma.superAdmin.findUnique({
        where: { id: userId },
      });
      if (isAdmin && socketId) {
        io.to(socketId).emit("unread_users_with_counts", data);
      }
    }
  } catch (error) {
    console.error("❌ Error sending unread counts:", error);
  }
};

const onLineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("register", async (userId) => {
      await registerSocketUser(userId, socket, onLineUsers);
      await sendUnreadCountsToAdmins(io, onLineUsers);
    });

    socket.on("typing", (data) => {
      const receiverSocketId = onLineUsers.get(data.receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("typing", data);
      }
    });

    socket.on("stop_typing", (data) => {
      const receiverSocketId = onLineUsers.get(data.receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("stop_typing", data);
      }
    });

    socket.on("send_message", (data, callback) => {
      handleSendMessage(socket, data, onLineUsers, callback);
    });

    socket.on("mark_messages_as_read", (data) => {
      handleMarkMessagesAsRead(socket, data);
    });

    socket.on("fetch_chat_with_user", (data) => {
      handleFetchChatMessages(socket, data);
    });

    socket.on("get_senders_for_admin", () => {
      handleGetSendersForAdmin(socket);
    });

    socket.on("disconnect", () => {
      for (const [userId, sId] of onLineUsers.entries()) {
        if (sId === socket.id) {
          onLineUsers.delete(userId);
          break;
        }
      }
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

module.exports = { initSocket };
