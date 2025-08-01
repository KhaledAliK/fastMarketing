const fs = require("fs");
const cloudinary = require("../../../config/cloudinaryConfig");
const path = require("path");
const { getSock } = require("../../../platforms/whatsapp-baileys/whatsapp");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");

async function sendTextToGroup(groupJid, message) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const fullJid = groupJid.endsWith("@g.us") ? groupJid : `${groupJid}@g.us`;

  try {
    await sock.sendMessage(fullJid, { text: message });
    console.log("✅ Message sent to group:", fullJid);
  } catch (error) {
    console.error("❌ Send to group error:", error.message);
    throw error;
  }
}
async function sendImageToGroup(groupJid, imageUrl, caption = "") {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const fullJid = groupJid.endsWith("@g.us") ? groupJid : `${groupJid}@g.us`;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data, "binary");

    await sock.sendMessage(fullJid, {
      image: buffer,
      caption,
    });

    console.log("✅ Image sent to group:", fullJid);
  } catch (error) {
    console.error("❌ Send image to group error:", error.message);
    throw error;
  }
}
async function sendVideoToGroup(groupJid, videoUrl, caption = "") {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const fullJid = groupJid.endsWith("@g.us") ? groupJid : `${groupJid}@g.us`;

  try {
    const response = await axios.get(videoUrl, {
      responseType: "arraybuffer",
    });

    const videoBuffer = Buffer.from(response.data, "binary");

    await sock.sendMessage(fullJid, {
      video: videoBuffer,
      mimetype: "video/mp4",
      caption,
    });

    console.log("✅ Video sent to group:", fullJid);
  } catch (error) {
    console.error("❌ Send video to group error:", error.message);
    throw error;
  }
}
async function sendDocumentToGroup(groupJid, fileUrl, mimetype, fileName) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  const fullJid = groupJid.endsWith("@g.us") ? groupJid : `${groupJid}@g.us`;

  try {
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(response.data, "binary");

    await sock.sendMessage(fullJid, {
      document: fileBuffer,
      mimetype,
      fileName,
    });

    console.log("✅ Document sent to group:", fileName);
  } catch (error) {
    console.error("❌ Send document to group error:", error.message);
    throw error;
  }
}
async function sendVoiceToGroup(groupJid, audioBuffer) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  await sock.sendMessage(`${groupJid}@g.us`, {
    audio: audioBuffer,
    mimetype: "audio/ogg; codecs=opus",
    ptt: true,
  });
}
async function sendVoiceToGroups(groupJids, inputFilePath) {
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
          for (const groupId of groupJids) {
            const jid = groupId.endsWith("@g.us") ? groupId : `${groupId}@g.us`;

            try {
              await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: "audio/ogg; codecs=opus",
                ptt: true,
              });
              results.push({ groupId, status: "sent" });
            } catch (err) {
              results.push({ groupId, status: "failed", error: err.message });
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

// =================================Many Groups=========================================


// إرسال تسجيل صوتي
async function sendVoiceToGroup(sock, jid, inputPath) {
  const outputPath = inputPath.replace(path.extname(inputPath), ".ogg");

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libopus")
      .format("ogg")
      .on("end", async () => {
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          await sock.sendMessage(jid, {
            audio: audioBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
          });
          fs.unlinkSync(outputPath);
          resolve();
        } catch (err) {
          fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
          reject(err);
        }
      })
      .on("error", (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

// دالة إرسال لأنواع الرسائل
async function sendToWhatsAppGroup(type, jid, message, filePath, fileName, mimeType) {
  const sock = getSock();
  if (!sock) throw new Error("WhatsApp not connected");

  switch (type) {
    case "text":
      return await sock.sendMessage(jid, { text: message });

    case "image":
      return await sock.sendMessage(jid, {
        image: { url: filePath },
        caption: message || "",
      });

    case "video":
      return await sock.sendMessage(jid, {
        video: { url: filePath },
        caption: message || "",
        mimetype: "video/mp4",
      });

    case "document":
      const fileBuffer = fs.readFileSync(filePath);
      return await sock.sendMessage(jid, {
        document: fileBuffer,
        mimetype: mimeType,
        fileName: fileName,
      });

    case "voice":
      return await sendVoiceToGroup(sock, jid, filePath);

    default:
      throw new Error("Unsupported message type");
  }
}

module.exports = {
  sendTextToGroup,
  sendImageToGroup,
  sendVideoToGroup,
  sendVoiceToGroup,
  sendDocumentToGroup,
  sendVoiceToGroups,
  sendToWhatsAppGroup
};
