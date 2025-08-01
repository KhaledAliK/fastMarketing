require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");
const prisma = require("../../config/prisma");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
async function sendCode({ phoneNumber, userId, userType }) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    throw new Error("📛 phoneNumber is required and must be a string");
  }

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  const result = await client.invoke(
    new Api.auth.SendCode({
      phoneNumber,
      apiId,
      apiHash,
      settings: new Api.CodeSettings({}),
    })
  );

  const stringSession = client.session.save();

  const where = {};
  if (userType === "REGULAR_USER") where.userId = userId;
  else if (userType === "SUPERVISOR") where.supervisorId = userId;
  else if (userType === "SALES") where.salesId = userId;
  else if (userType === "SUPER_ADMIN") where.superAdminId = userId;
  else throw new Error("❌ Unknown user type");

  await prisma.telegramSession.upsert({
    where,
    update: {
      phoneCodeHash: result.phoneCodeHash,
      codeSentAt: new Date(),
      phoneNumber,
      session: stringSession,
    },
    create: {
      ...where,
      phoneCodeHash: result.phoneCodeHash,
      codeSentAt: new Date(),
      phoneNumber,
      session: stringSession,
    },
  });

  return result.phoneCodeHash;
}
async function verifyCode({ phoneNumber, code, userType, userId }) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    throw new Error("📛 phoneNumber is required and must be a string");
  }

  const where = {};
  if (userType === "REGULAR_USER") where.userId = userId;
  else if (userType === "SUPERVISOR") where.supervisorId = userId;
  else if (userType === "SALES") where.salesId = userId;
  else if (userType === "SUPER_ADMIN") where.superAdminId = userId;
  else throw new Error("❌ Unknown user type");

  const sessionEntry = await prisma.telegramSession.findUnique({
    where,
  });

  if (!sessionEntry) {
    throw new Error("❌ Session not found in database for user");
  }

  if (!sessionEntry.phoneCodeHash) {
    throw new Error("❌ phoneCodeHash is missing from session");
  }

  const stringSession = sessionEntry.session;
  const client = new TelegramClient(
    new StringSession(stringSession || ""),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCode: code,
        phoneCodeHash: sessionEntry.phoneCodeHash,
      })
    );
  } catch (err) {
    console.error("Telegram login error:", err);
    throw err;
  }

  const session = client.session.save();

  await prisma.telegramSession.update({
    where,
    data: {
      session,
      phoneCodeHash: null,
    },
  });

  return session;
}

async function checkTelegramAccount(client, phoneNumber) {
  try {
    const result = await client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId: BigInt(Date.now()),
            phone: phoneNumber,
            firstName: "Check",
            lastName: "User",
          }),
        ],
      })
    );

    const user = result.users?.[0];
    return {
      exists: !!user,
      user: user || null,
    };
  } catch (err) {
    console.error(`❌ checkTelegramAccount error for ${phoneNumber}:`, err.message);
    return { exists: false, error: err.message };
  }
}


module.exports = {
  sendCode,
  verifyCode,
  checkTelegramAccount
};
