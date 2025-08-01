const { getClient, isClientReady } = require("./whatsAppClient");
const { MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
const prisma = require("../../../config/prisma");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const cloudinary = require("../../../config/cloudinary");


/**
 * @title Send message
 * @platform WhatsApp
 * @desc Send message by subscribed user
 */
async function sendTextMessage(
  phoneNumber,
  message,
  platformId,
  userSubscriptionId
) {
  const client = getClient();

  if (!isClientReady()) {
    console.log("WhatsApp client is not ready yet!");
    return { success: false, error: "Client not ready" };
  }

  try {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      return { success: false, error: "Platform not found" };
    }
    if (!platform.status) {
      return { success: false, error: "Platform is disabled" };
    }
    const contact = `${phoneNumber}@c.us`;
    const sentMessage = await client.sendMessage(contact, message);
    await prisma.message.create({
      data: {
        messageText: message,
        platformId,
        userSubscriptionId,
        messageType: "TEXT",
        whatsAppMessageId: sentMessage?.id?._serialized || null,
      },
    });
    return { success: true, message: "Message sent successfully" };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * @title Edit message
 * @platform WhatsApp
 * @desc Edit message by subscribed user
 */
async function editTextMessage(messageId, newMessage) {
  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        userSubscription: {
          include: {
            user: {
              select: { phoneNumber: true },
            },
          },
        },
      },
    });
    if (!existingMessage) {
      return { success: false, error: "Message not found" };
    }
    const platform = await prisma.platform.findUnique({
      where: { id: existingMessage.platformId },
    });
    if (!platform) {
      return { success: false, error: "Platform not fount" };
    }
    if (!platform.status) {
      return { success: false, error: "Platform is paused" };
    }
    const client = getClient();
    const phoneNumber = existingMessage.userSubscription.user.phoneNumber;
    const contact = `${phoneNumber}@c.us`;
    if (existingMessage.whatsAppMessageId && isClientReady()) {
      try {
        const chat = await client.getChatById(contact);
        const messages = await chat.fetchMessages({ limit: 50 });
        const oldMsg = messages.find(
          (msg) => msg.id._serialized === existingMessage.whatsAppMessageId
        );
        if (oldMsg) {
          await oldMsg.delete();
        } else {
          console.warn("Old message not found in cache.");
        }
      } catch (err) {
        console.warn("Failed to delete old WhatsApp message:", err.message);
      }
    }
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
      },
    });

    let sentMessage = null;
    if (isClientReady()) {
      sentMessage = await client.sendMessage(contact, newMessage);
    }

    if (!sentMessage) {
      console.error("Failed to send message:", newMessage);
      return { success: false, error: "Failed to send message" };
    }

    await prisma.message.create({
      data: {
        messageText: newMessage,
        platformId: existingMessage.platformId,
        userSubscriptionId: existingMessage.userSubscriptionId,
        messageType: "TEXT",
        isEdited: true,
        originalText: existingMessage.messageText,
        editedAt: new Date(),
        whatsAppMessageId: sentMessage?.id?._serialized || null,
      },
    });
    return { success: true, message: "Message edited successfully" };
  } catch (error) {
    console.log("Error editing message", error);
    return { success: false, error: "Failed to edit message" };
  }
}

/**
 * @title Send bulk message
 * @platform WhatsApp
 * @desc Send message to multiple users by subscribed user
 */
async function sendBulkTextMessage(
  phoneNumbers,
  message,
  platformId,
  userSubscriptionId
) {
  const client = getClient();

  if (!isClientReady()) {
    console.log("WhatsApp client is not ready yet!");
    return { success: false, error: "Client not ready" };
  }

  try {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      return { success: false, error: "Platform not found" };
    }
    if (!platform.status) {
      return { success: false, error: "Platform is disabled" };
    }

    const results = [];

    for (const phoneNumber of phoneNumbers) {
      const contact = `${phoneNumber}@c.us`;

      try {
        const sentMessage = await client.sendMessage(contact, message);

        await prisma.message.create({
          data: {
            messageText: message,
            platformId,
            userSubscriptionId,
            messageType: "TEXT",
            whatsAppMessageId: sentMessage?.id?._serialized || null,
          },
        });

        results.push({
          phoneNumber,
          success: true,
          message: "Message sent successfully",
        });
      } catch (err) {
        console.error(`Failed to send to ${phoneNumber}:`, err.message);
        results.push({
          phoneNumber,
          success: false,
          error: err.message,
        });
      }
    }
    return { success: true, results };
  } catch (error) {
    console.error("Error in bulk message sending:", error);
    return { success: false, error: "Failed to send bulk message" };
  }
}

/**
 * @title Send media
 * @platform WhatsApp
 * @desc Send media file to a user (image, video, document)
 */
async function sendMediaMessage(
  phoneNumber,
  base64File,
  mimeType,
  fileName,
  platformId,
  userSubscriptionId
) {
  const client = getClient();

  if (!isClientReady()) {
    console.log("WhatsApp client is not ready yet!");
    return { success: false, error: "Client not ready" };
  }

  try {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      return { success: false, error: "Platform not found" };
    }
    if (!platform.status) {
      return { success: false, error: "Platform is disabled" };
    }

    const media = new MessageMedia(mimeType, base64File, fileName);
    const contact = `${phoneNumber}@c.us`;

    const sentMessage = await client.sendMessage(contact, media);

    await prisma.message.create({
      data: {
        messageText: fileName,
        platformId,
        userSubscriptionId,
        messageType: "MEDIA",
        whatsAppMessageId: sentMessage?.id?._serialized || null,
      },
    });
    return { success: true, message: "Media message sent successfully" };
  } catch (error) {
    console.error("Error sending media:", error);
    return { success: false, error: "Failed to send media message" };
  }
}

/**
 * @title Send bulk media message
 * @platform WhatsApp
 * @desc Send media (image/video/document) to multiple users
 */
async function sendBulkMediaMessage(
  phoneNumbers,
  fileUrl,
  mimeType,
  platformId,
  userSubscriptionId
) {
  const client = getClient();

  if (!isClientReady()) {
    return { success: false, error: "Client not ready" };
  }

  try {
    const platform = await prisma.platform.findUnique({ where: { id: platformId } });

    if (!platform || !platform.status) {
      return { success: false, error: "Platform not found or disabled" };
    }
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const base64Data = Buffer.from(response.data, "binary").toString("base64");
    const extension = mimeType.split("/")[1] || "file";
    const fileName = `file.${extension}`;

    const media = new MessageMedia(mimeType, base64Data, fileName);

    const results = [];

    for (const phoneNumber of phoneNumbers) {
      const contact = `${phoneNumber}@c.us`;

      try {
        const sentMessage = await client.sendMessage(contact, media);

        await prisma.message.create({
          data: {
            messageText: fileUrl,
            platformId,
            userSubscriptionId,
            messageType: "MEDIA",
            whatsAppMessageId: sentMessage?.id?._serialized || null,
          },
        });

        results.push({
          phoneNumber,
          success: true,
          message: "Media message sent successfully",
        });
      } catch (err) {
        console.error(`Failed to send to ${phoneNumber}:`, err.message);
        results.push({
          phoneNumber,
          success: false,
          error: err.message,
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("Upload/send error:", error.message);
    return { success: false, error: "Upload/send error: " + error.message };
  }
}

/**
 * @title Send bulk video message
 * @platform WhatsApp
 * @desc Send media (image/video/document) to multiple users
 */
async function sendBulkVideoMessage(
  phoneNumbers,
  inputFilePath,
  platformId,
  userSubscriptionId
) {
  const client = getClient();

  if (!isClientReady()) {
    return { success: false, error: "WhatsApp client is not ready" };
  }

  const convertedDir = path.join(__dirname, "../../../converted");
  if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir);

  const outputFilePath = path.join(
    convertedDir,
    `${Date.now()}_ready.mp4`
  );

  const command = `ffmpeg -i "${inputFilePath}" -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -acodec aac -movflags +faststart "${outputFilePath}"`;

  return new Promise((resolve) => {
    exec(command, async (err) => {
      if (err) {
        fs.existsSync(inputFilePath) && fs.unlinkSync(inputFilePath);
        return resolve({
          success: false,
          error: "Video conversion failed",
        });
      }

      try {
        // Upload to Cloudinary (اختياري، لو حابب تخزن الرابط)
        const result = await cloudinary.uploader.upload(outputFilePath, {
          resource_type: "video",
        });
        const fileUrl = result.secure_url;

        // قراءة الملف مباشرة من الجهاز بدون axios
        const fileBuffer = fs.readFileSync(outputFilePath);
        const base64 = fileBuffer.toString("base64");
        const media = new MessageMedia("video/mp4", base64, "video.mp4");

        const results = [];

        for (const phone of phoneNumbers) {
          const chatId = `${phone}@c.us`;
          try {
            const sentMsg = await client.sendMessage(chatId, media);

            await prisma.message.create({
              data: {
                messageText: fileUrl,
                platformId,
                userSubscriptionId,
                messageType: "MEDIA",
                whatsAppMessageId: sentMsg.id._serialized,
              },
            });

            results.push({ phoneNumber: phone, success: true });
          } catch (error) {
            console.error(`❌ Failed to send to ${phone}:`, error.message);
            results.push({
              phoneNumber: phone,
              success: false,
              error: error?.message || error,
            });
          }
        }

        fs.existsSync(inputFilePath) && fs.unlinkSync(inputFilePath);
        fs.existsSync(outputFilePath) && fs.unlinkSync(outputFilePath);

        return resolve({ success: true, results });
      } catch (error) {
        return resolve({
          success: false,
          error: "Upload/send failed: " + error.message,
        });
      }
    });
  });
}




module.exports = {
  sendTextMessage,
  editTextMessage,
  sendBulkTextMessage,
  sendMediaMessage,
  sendBulkMediaMessage,
  sendBulkVideoMessage
};
