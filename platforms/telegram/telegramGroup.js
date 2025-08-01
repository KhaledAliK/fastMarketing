const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const fs = require("fs").promises;
const path = require("path");
const prisma = require("../../config/prisma");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

async function createTelegramGroup({
  session,
  groupName,
  imageUrl,
  countryId,
  platformId,
  userId,
  userType,
}) {
  const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  await client.connect();
  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: groupName,
      about: "Group for country-specific platform",
      megagroup: true,
    })
  );

  const group = result.chats?.[0];

  if (!group) {
    throw new Error("❌ Failed to create group");
  }

  if (imageUrl) {
    try {
      const imagePath = path.resolve(imageUrl);
      const imageBuffer = await fs.readFile(imagePath);

      const uploadedFile = await client.uploadFile({
        file: {
          name: "group-image.jpg",
          buffer: imageBuffer,
        },
      });

      await client.invoke(
        new Api.channels.EditPhoto({
          channel: group,
          photo: new Api.InputChatUploadedPhoto({
            file: uploadedFile,
          }),
        })
      );
    } catch (err) {
      console.error("❌ Failed to upload group image:", err);
    }
  }

  const savedGroup = await prisma.platformGroup.create({
    data: {
      name: groupName,
      link: `https://t.me/c/${group.id}`,
      imageUrl: imageUrl || null,
      telegramId: String(group.id),
      accessHash: String(group.accessHash),
      countryId,
      platformId,
      ...(userType === "REGULAR_USER" && { userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  await client.disconnect();

  return savedGroup;
}

async function deleteTelegramGroup(groupId, userType, userId) {
  const group = await prisma.platformGroup.findUnique({
    where: { id: groupId },
    include: {
      user: true,
      superAdmin: true,
      supervisor: true,
      sales: true,
    },
  });

  if (!group || !group.telegramId || !group.accessHash) {
    throw new Error("❌ Group not found or missing Telegram identifiers");
  }

  const sessionRecord = await prisma.telegramSession.findFirst({
    where: {
      ...(userType === "REGULAR_USER" && { userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  if (!sessionRecord) {
    throw new Error("❌ Telegram session not found");
  }

  const session = sessionRecord.session;

  const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();

  await client.invoke(
    new Api.channels.DeleteChannel({
      channel: new Api.InputChannel({
        channelId: BigInt(group.telegramId),
        accessHash: BigInt(group.accessHash),
      }),
    })
  );

  await client.disconnect();

  await prisma.platformGroup.delete({ where: { id: groupId } });

  return { message: "✅ Group deleted successfully" };
}

async function sendTelegramMessage({
  groupId,
  userId,
  userType,
  type,
  contentPath,
  messageText,
}) {
  try {
    const group = await prisma.platformGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || !group.telegramId || !group.accessHash) {
      throw new Error("❌ Group not found or missing Telegram identifiers");
    }

    const sessionRecord = await prisma.telegramSession.findFirst({
      where: {
        ...(userType === "REGULAR_USER" && { userId }),
        ...(userType === "SUPERVISOR" && { supervisorId: userId }),
        ...(userType === "SALES" && { salesId: userId }),
        ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
      },
    });

    if (!sessionRecord) {
      throw new Error("❌ Telegram session not found");
    }

    const client = new TelegramClient(
      new StringSession(sessionRecord.session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();

    const channel = new Api.InputChannel({
      channelId: BigInt(group.telegramId),
      accessHash: BigInt(group.accessHash),
    });

    if (type === "text") {
      if (!messageText) throw new Error("❌ Text message is empty");

      await client.invoke(
        new Api.messages.SendMessage({
          peer: channel,
          message: messageText,
          randomId: BigInt(Date.now()),
        })
      );
    } else if (["photo", "file", "audio", "voice"].includes(type)) {
      if (!contentPath) throw new Error("❌ File path is missing");

      const absolutePath = path.resolve(contentPath);
      await fs.access(absolutePath);

      const stats = await fs.stat(absolutePath);
      if (stats.size === 0) throw new Error("❌ الملف فارغ");

      const fileBuffer = await fs.readFile(absolutePath);

      const uploadedFile = await client.uploadFile({
        file: fileBuffer,
        fileName: path.basename(absolutePath),
      });

      const mimeTypeMap = {
        photo: "image/jpeg",
        file: "application/octet-stream",
        audio: "audio/ogg",
        voice: "audio/ogg",
      };

      const attributes = [
        new Api.DocumentAttributeFilename({
          fileName: path.basename(absolutePath),
        }),
      ];

      const inputMedia =
        type === "photo"
          ? new Api.InputMediaUploadedPhoto({ file: uploadedFile })
          : new Api.InputMediaUploadedDocument({
              file: uploadedFile,
              mimeType: mimeTypeMap[type],
              attributes,
            });

      await client.invoke(
        new Api.messages.SendMedia({
          peer: channel,
          media: inputMedia,
          message: messageText || "",
          randomId: BigInt(Date.now()),
        })
      );

      await fs.unlink(absolutePath);
    } else {
      throw new Error("❌ Unsupported message type");
    }

    await client.disconnect();
    return { success: true, message: "✅ Message sent successfully" };
  } catch (error) {
    console.error("🔴 Error sending Telegram message:", error.message);
    return {
      success: false,
      message: "❌ Failed to send message",
      error: error.message,
    };
  }
}

async function sendTelegramMediaMessageWithMulter({
  groupId,
  userId,
  userType,
  filePath,
  caption,
}) {
  try {
    const group = await prisma.platformGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || !group.telegramId || !group.accessHash) {
      throw new Error("❌ Group not found or missing Telegram identifiers");
    }

    const sessionRecord = await prisma.telegramSession.findFirst({
      where: {
        ...(userType === "REGULAR_USER" && { userId }),
        ...(userType === "SUPERVISOR" && { supervisorId: userId }),
        ...(userType === "SALES" && { salesId: userId }),
        ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
      },
    });

    if (!sessionRecord) {
      throw new Error("❌ Telegram session not found");
    }

    const client = new TelegramClient(
      new StringSession(sessionRecord.session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();

    const channel = new Api.InputChannel({
      channelId: BigInt(group.telegramId),
      accessHash: BigInt(group.accessHash),
    });

    await client.sendFile(channel, {
      file: filePath,
      caption: caption || "",
    });

    await client.disconnect();

    await fs.unlink(filePath);

    return { success: true, message: "✅ Media message sent successfully" };
  } catch (err) {
    console.error("🔴 Error sending media:", err.message);
    return {
      success: false,
      message: "❌ Failed to send media",
      error: err.message,
    };
  }
}

async function sendTelegramMediaMessageToMultipleGroups({
  groupIds,
  userId,
  userType,
  filePath,
  caption,
}) {
  try {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      throw new Error("❌ groupIds must be a non-empty array");
    }
    const sessionRecord = await prisma.telegramSession.findFirst({
      where: {
        ...(userType === "REGULAR_USER" && { userId }),
        ...(userType === "SUPERVISOR" && { supervisorId: userId }),
        ...(userType === "SALES" && { salesId: userId }),
        ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
      },
    });

    if (!sessionRecord) {
      throw new Error("❌ Telegram session not found");
    }

    const client = new TelegramClient(
      new StringSession(sessionRecord.session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();

    const results = [];
    for (const groupId of groupIds) {
      try {
        const group = await prisma.platformGroup.findUnique({
          where: { id: groupId },
        });

        if (!group || !group.telegramId || !group.accessHash) {
          results.push({
            groupId,
            success: false,
            message: "❌ Group not found or missing Telegram identifiers",
          });
          continue;
        }

        const channel = new Api.InputChannel({
          channelId: BigInt(group.telegramId),
          accessHash: BigInt(group.accessHash),
        });

        await client.sendFile(channel, {
          file: filePath,
          caption: caption || "",
        });

        results.push({
          groupId,
          success: true,
          message: "✅ Media message sent",
        });
      } catch (groupErr) {
        results.push({
          groupId,
          success: false,
          message: `❌ Error sending to group: ${groupErr.message}`,
        });
      }
    }

    await client.disconnect();
    await fs.unlink(filePath);

    return { success: true, results };
  } catch (err) {
    console.error("🔴 Error sending media to groups:", err.message);
    return {
      success: false,
      message: "❌ Failed to send to groups",
      error: err.message,
    };
  }
}

async function sendTelegramTextToMultipleGroups({
  groupIds,
  userId,
  userType,
  messageText,
}) {
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    throw new Error("❌ groupIds must be an array containing group IDs");
  }

  if (!messageText) {
    throw new Error("❌ Text message is empty");
  }

  try {
    const sessionRecord = await prisma.telegramSession.findFirst({
      where: {
        ...(userType === "REGULAR_USER" && { userId }),
        ...(userType === "SUPERVISOR" && { supervisorId: userId }),
        ...(userType === "SALES" && { salesId: userId }),
        ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
      },
    });

    if (!sessionRecord) {
      throw new Error("❌ Telegram session not found");
    }

    const client = new TelegramClient(
      new StringSession(sessionRecord.session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();

    for (const groupId of groupIds) {
      const group = await prisma.platformGroup.findUnique({
        where: { id: groupId },
      });

      if (!group || !group.telegramId || !group.accessHash) {
        console.warn(
          `⚠️ Group ${groupId} not found or missing Telegram identifiers`
        );
        continue;
      }

      const channel = new Api.InputChannel({
        channelId: BigInt(group.telegramId),
        accessHash: BigInt(group.accessHash),
      });

      await client.invoke(
        new Api.messages.SendMessage({
          peer: channel,
          message: messageText,
          randomId: BigInt(Date.now() + Math.floor(Math.random() * 10000)),
        })
      );
    }

    await client.disconnect();

    return { success: true, message: "✅ Message sent to all groups" };
  } catch (error) {
    console.error("🔴 Error sending text message:", error.message);
    return {
      success: false,
      message: "❌ Failed to send message",
      error: error.message,
    };
  }
}

module.exports = {
  createTelegramGroup,
  deleteTelegramGroup,
  sendTelegramMessage,
  sendTelegramMediaMessageWithMulter,
  sendTelegramMediaMessageToMultipleGroups,
  sendTelegramTextToMultipleGroups,
};
