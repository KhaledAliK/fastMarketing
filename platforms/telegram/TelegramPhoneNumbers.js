const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

async function sendMessageToMultiplePhones({
  sessionString,
  message,
  phoneNumbers = [],
  type = "text",
  filePath = null,
}) {
  if (!sessionString) throw new Error("🚫 Missing sessionString");
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0)
    throw new Error("🚫 phoneNumbers must be a non-empty array");

  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  await client.connect();

  const results = [];

  for (const phone of phoneNumbers) {
    try {
      const imported = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Date.now()),
              phone,
              firstName: "User",
              lastName: "Target",
            }),
          ],
        })
      );

      const user = imported.users?.[0];
      if (!user) {
        results.push({ phone, status: "❌ User not found" });
        continue;
      }

      if (type === "text") {
        await client.sendMessage(user, { message });
      } else if (type === "photo" || type === "video") {
        const absolutePath = path.resolve(filePath);

        if (type === "photo") {
          await client.sendFile(user, {
            file: absolutePath,
            caption: message || "",
          });
        } else if (type === "video") {
          await client.sendFile(user, {
            file: absolutePath,
            caption: message || "",
            video: true,
          });
        }
      }

      results.push({ phone, status: "✅ Sent successfully" });
    } catch (err) {
      console.error(`❌ Failed to send to ${phone}:`, err.message);
      results.push({ phone, status: `❌ Error: ${err.message}` });
    }
  }

  return results;
}
module.exports = { sendMessageToMultiplePhones };
