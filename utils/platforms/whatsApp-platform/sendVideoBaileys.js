// const fs = require("fs");
// const path = require("path");
// const { getSock } = require("../../../platforms/whatsapp-baileys/whatsapp");


// async function sendVideoToPhone(phoneNumber, videoPath) {
//   return new Promise(async (resolve, reject) => {
//     const sock = getSock();

//     if (!sock) {
//       return reject({ success: false, error: "WhatsApp not connected" });
//     }

//     try {
//       const videoBuffer = fs.readFileSync(videoPath);
//       const whatsappId = `${phoneNumber}@s.whatsapp.net`;

//       await sock.sendMessage(whatsappId, {
//         video: videoBuffer,
//         mimetype: "video/mp4",
//         caption: "🎥 Video from Fast Marketing",
//       });

//       return resolve({ success: true, phoneNumber });
//     } catch (error) {
//       return reject({ success: false, error: error.message });
//     }
//   });
// }

// module.exports = { sendVideoToPhone };

const fs = require("fs");
const path = require("path");
const { getSock } = require("../../../platforms/whatsapp-baileys/whatsapp");


async function sendVideoToPhone(phoneNumber, videoUrl) {
  return new Promise(async (resolve, reject) => {
    const sock = getSock();

    if (!sock) {
      return reject({ success: false, error: "WhatsApp not connected" });
    }

    try {
      const whatsappId = `${phoneNumber}@s.whatsapp.net`;

      await sock.sendMessage(whatsappId, {
        video: { url: videoUrl},
        mimetype: "video/mp4",
        caption: "🎥 Video from Fast Marketing",
      });

      return resolve({ success: true, phoneNumber });
    } catch (error) {
      return reject({ success: false, error: error.message });
    }
  });
}

module.exports = { sendVideoToPhone };
