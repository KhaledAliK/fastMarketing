const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const qrCode = require("qrcode-terminal");

let sockGlobal;
async function startSock(phoneNumber) {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "../../../platform-sessions")
  );

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode.generate(qr, { small: true }); 
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection closed", lastDisconnect?.error);
      if (shouldReconnect) startSock();
    }

    if (connection === "open") {
      console.log("✅ Connected to WhatsApp");
    }
  });
  sockGlobal = sock;
}
function getSock() {
  return sockGlobal;
}

module.exports = { startSock, getSock };
