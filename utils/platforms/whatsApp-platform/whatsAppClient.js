const fs = require("fs");
const path = require("path");
const { Client } = require("whatsapp-web.js");
const qrCode = require("qrcode-terminal");

const SESSION_FILE_PATH = path.resolve(
  __dirname,
  "../platform-sessions",
  "whatsApp-session.json"
);

let client;
let isClientReady = false;

async function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE_PATH)) {
      const fileContent = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
      if (fileContent.trim()) {
        console.log("Session loaded successfully.");
        return JSON.parse(fileContent);
      } else {
        console.log("Session file is empty. Need QR scan.");
        return null;
      }
    } else {
      console.log("No session file found. Need QR scan.");
      return null;
    }
  } catch (error) {
    console.error("Error loading session:", error);
  }
  return null;
}

function saveSession(session) {
  try {
    const dir = path.dirname(SESSION_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
    console.log("Session saved successfully.");
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeClient() {
  const sessionData = await loadSession();

  client = new Client({ session: sessionData });

  client.on("qr", (qr) => {
    console.log("QR Code received. Please scan:");
    qrCode.generate(qr, { small: true });
  });

  client.on("authenticated", (session) => {
    console.log("Authenticated successfully.");
    if (session) {
      saveSession(session);
    } else {
      console.error("No session data received.");
    }
  });

  client.on("ready", () => {
    console.log("WhatsApp Client is ready.");
    isClientReady = true;
  });

  client.initialize();
}

module.exports = {
  initializeClient,
  getClient: () => client,
  isClientReady: () => isClientReady,
};
