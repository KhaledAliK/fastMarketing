const fs = require("fs");
const cloudinary = require("../../../config/cloudinaryConfig");
const path = require("path");
const { getSock } = require("../../../platforms/whatsapp-baileys/whatsapp");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

async function sendBulkMessages(numbers, type, message, file) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const results = [];
  let mediaUrl;

  if (file) {
    const upload = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "my-files",
      access_mode: "public",
    });
    mediaUrl = upload.secure_url;
    fs.unlinkSync(file.path);
  }

  for (const phone of numbers) {
    const jid = `${phone}@s.whatsapp.net`;
    try {
      switch (type) {
        case "text":
          await sock.sendMessage(jid, { text: message });
          break;

        case "image":
          await sock.sendMessage(jid, {
            image: { url: mediaUrl },
            caption: message || "",
          });
          break;

        case "document":
          const response = await axios.get(mediaUrl, {
            responseType: "arraybuffer",
            headers: {
              "Content-Type": "application/pdf",
            },
          });
          const fileBuffer = response.data;
          await sock.sendMessage(jid, {
            document: { url: mediaUrl },
            mimetype: "application/pdf",
            fileName: "document.pdf",
            caption: message || "",
          });
          break;

        default:
          throw new Error("Unsupported message type");
      }

      results.push({ phone, status: "sent" });
    } catch (error) {
      results.push({ phone, status: "failed", error: error.message });
    }
  }
  return results;
}

async function sendVoiceMessage(phones, inputFilePath) {
  const outputPath = inputFilePath.replace(path.extname(inputFilePath), ".ogg");

  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioCodec("libopus")
      .format("ogg")
      .on("end", async () => {
        const sock = getSock();
        if (!sock) {
          fs.unlinkSync(outputPath);
          return reject({ success: false, message: "WhatsApp not connected" });
        }

        const results = [];
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          for (const phone of phones) {
            try {
              await sock.sendMessage(`${phone}@s.whatsapp.net`, {
                audio: audioBuffer,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              });
              results.push({ phone, status: "sent" });
            } catch (err) {
              results.push({ phone, status: "failed", error: err.message });
            }
          }

          resolve({ success: true, results });
        } catch (err) {
          reject({ success: false, message: err.message });
        } finally {
          fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
          fs.existsSync(inputFilePath) && fs.unlinkSync(inputFilePath);
        }
      })
      .on("error", (err) => {
        reject({ success: false, message: "FFmpeg error: " + err.message });
      })
      .save(outputPath);
  });
}

async function createGroup(subject, participants = [], options = {}) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const jids = participants.map((phone) =>
    phone.endsWith("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`
  );

  const groupRes = await sock.groupCreate(subject, jids);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let inviteCode;
  try {
    inviteCode = await sock.groupInviteCode(groupRes.id);
  } catch (err) {
    console.error("⚠️ Failed to get invite code:", err.message);
    inviteCode = null;
  }

  if (options.imagePath && fs.existsSync(options.imagePath)) {
    try {
      await sock.updateProfilePicture(groupRes.id, {
        url: options.imagePath,
      });
    } catch (error) {
      console.warn("⚠️ Failed to set image:", error.message);
    }
  }

  return {
    ...groupRes,
    inviteCode,
    inviteLink: inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null,
  };
}

async function deleteGroup(whatsappJid) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  try {
    console.log("📍 Deleting group:", whatsappJid);

    const groupMeta = await sock.groupMetadata(whatsappJid);
    const participants = groupMeta.participants.map((p) => p.id);

    for (const participant of participants) {
      if (participant !== sock.user.id) {
        await sock.groupParticipantsUpdate(
          whatsappJid,
          [participant],
          "remove"
        );
        await new Promise((res) => setTimeout(res, 100));
      }
    }

    await sock.groupLeave(whatsappJid);

    return { success: true, message: "Group deleted from WhatsApp" };
  } catch (err) {
    console.error("❌ Error deleting group:", err.message);
    throw new Error("Failed to delete group: " + err.message);
  }
}

async function addUserToGroup(inviteLink, phoneNumber) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const code = inviteLink.trim().split("/").pop();

  let groupId;

  try {
    const metadata = await sock.groupMetadata(code);
    groupId = metadata.id;
  } catch {
    groupId = await sock.groupAcceptInvite(code);
  }

  const jid = phoneNumber.endsWith("@s.whatsapp.net")
    ? phoneNumber
    : `${phoneNumber}@s.whatsapp.net`;

  await sock.groupParticipantsUpdate(groupId, [jid], "add");

  return { success: true, groupId };
}

async function sendTextToMultipleGroups(groupJids = [], message) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const results = [];

  for (const jid of groupJids) {
    try {
      await sock.sendMessage(jid, { text: message });
      results.push({ group: jid, status: "sent" });
    } catch (err) {
      results.push({ group: jid, status: "failed", error: err.message });
    }
  }

  return results;
}

async function sendWhatsAppMediaToMultipleGroups({
  groupJids,
  file,
  caption,
  type,
}) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const results = [];

  const inputPath = file.path;
  let finalPath = inputPath;
  let mimeType = file.mimetype;

  if (type === "voice") {
    const outputPath = inputPath.replace(path.extname(inputPath), ".ogg");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec("libopus")
        .format("ogg")
        .on("end", () => {
          finalPath = outputPath;
          mimeType = "audio/ogg; codecs=opus";
          resolve();
        })
        .on("error", (err) => reject(err))
        .save(outputPath);
    });
  }

  const buffer = fs.readFileSync(finalPath);

  for (const group of groupJids) {
    try {
      const jid = group.endsWith("@g.us") ? group : `${group}@g.us`;

      const messageOptions = {
        caption: caption || "",
      };

      switch (type) {
        case "image":
          messageOptions.image = buffer;
          break;
        case "video":
          messageOptions.video = buffer;
          break;
        case "document":
          messageOptions.document = buffer;
          messageOptions.mimetype = mimeType;
          messageOptions.fileName = file.originalname;
          break;
        case "voice":
          messageOptions.audio = buffer;
          messageOptions.mimetype = mimeType;
          messageOptions.ptt = true;
          break;
        default:
          throw new Error("❌ Unsupported media type");
      }

      await sock.sendMessage(jid, messageOptions);
      results.push({ group, status: "sent" });
    } catch (err) {
      results.push({ group, status: "failed", error: err.message });
    }
  }

  // Cleanup
  if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  if (type === "voice" && fs.existsSync(finalPath) && finalPath !== inputPath) {
    fs.unlinkSync(finalPath);
  }

  return { success: true, results };
}

module.exports = {
  sendBulkMessages,
  sendVoiceMessage,
  createGroup,
  deleteGroup,
  addUserToGroup,
  sendTextToMultipleGroups,
  sendWhatsAppMediaToMultipleGroups,
};

