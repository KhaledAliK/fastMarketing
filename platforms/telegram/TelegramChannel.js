const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const prisma = require("../../config/prisma");
const fs = require("fs");
const path = require("path");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

async function createTelegramChannel({
  countryName,
  platformId,
  channelName,
  description,
  userId,
  userType,
  language = "ar",
}) {
  const country = await prisma.country.findFirst({
    where:
      language === "ar" ? { nameAr: countryName } : { nameEn: countryName },
  });

  if (!country) {
    throw new Error("❌ Country not found");
  }

  const sessionRecord = await prisma.telegramSession.findFirst({
    where: {
      ...(userType === "REGULAR_USER" && { userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  if (!sessionRecord || !sessionRecord.session) {
    throw new Error("❌ There is nor valid session for user");
  }

  const client = new TelegramClient(
    new StringSession(sessionRecord.session),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();

  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: channelName,
      about: description || "Automatically created channel",
      megagroup: false,
    })
  );

  const channel = result.chats?.[0];

  if (!channel || !channel.id || !channel.accessHash) {
    throw new Error("❌ Failed to create channel");
  }

  const link = `https://t.me/c/${channel.id.toString().slice(4)}`;

  const savedChannel = await prisma.platformChannel.create({
    data: {
      name: channelName,
      description: description || null,
      telegramId: String(channel.id),
      accessHash: String(channel.accessHash),
      link,
      countryId: country.id,
      platformId,
      ...(userType === "REGULAR_USER" && { regularUserId: userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  await client.disconnect();

  return savedChannel;
}

async function sendTelegramMessageToChannels({
  channelIds,
  userId,
  userType,
  type,
  contentPath,
  messageText,
}) {
  if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
    throw new Error("❌ channelIds is required and must be an array");
  }

  const sessionRecord = await prisma.telegramSession.findFirst({
    where: {
      ...(userType === "REGULAR_USER" && { userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  if (!sessionRecord || !sessionRecord.session) {
    throw new Error("❌ Telegram session not found for user");
  }

  const client = new TelegramClient(
    new StringSession(sessionRecord.session),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();

  for (const channelId of channelIds) {
    const channel = await prisma.platformChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel || !channel.telegramId || !channel.accessHash) {
      console.warn(`❌ Channel ${channelId} not found or missing identifiers`);
      continue;
    }

    try {
      const inputPeer = new Api.InputPeerChannel({
        channelId: BigInt(channel.telegramId),
        accessHash: BigInt(channel.accessHash),
      });

      if (["image", "video", "file"].includes(type)) {
        const filePath = path.resolve(contentPath);
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️ File not found: ${filePath}`);
          continue;
        }

        await client.sendFile(inputPeer, {
          file: filePath,
          caption: messageText || "",
        });
      } else {
        await client.sendMessage(inputPeer, {
          message: messageText || "",
        });
      }

      console.log(`✅ Message sent to channel ${channel.name}`);
    } catch (error) {
      console.error(
        `❌ Failed to send to channel ${channel.name}:`,
        error.message
      );
    }
  }

  await client.disconnect();
}

async function getTelegramIdAndHashFromLink(link, userId, userType) {
  if (!link.includes("t.me")) {
    throw new Error("❌ Invalid Telegram link");
  }

  const sessionRecord = await prisma.telegramSession.findFirst({
    where: {
      ...(userType === "REGULAR_USER" && { userId }),
      ...(userType === "SUPERVISOR" && { supervisorId: userId }),
      ...(userType === "SALES" && { salesId: userId }),
      ...(userType === "SUPER_ADMIN" && { superAdminId: userId }),
    },
  });

  if (!sessionRecord || !sessionRecord.session) {
    throw new Error("❌ Telegram session not found for user");
  }

  const client = new TelegramClient(
    new StringSession(sessionRecord.session),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  try {
    await client.connect();

    const username = link.replace("https://t.me/", "").split("?")[0];

    const entity = await client.getEntity(username);

    if (!entity || !entity.id || !entity.accessHash) {
      throw new Error("❌ Failed to extract Telegram info from link");
    }

    return {
      telegramId: entity.id.toString(),
      accessHash: entity.accessHash.toString(),
    };
  } catch (error) {
    throw new Error(`❌ Error fetching Telegram data: ${error.message}`);
  } finally {
    await client.disconnect();
  }
}

module.exports = {
  createTelegramChannel,
  sendTelegramMessageToChannels,
  getTelegramIdAndHashFromLink,
};
