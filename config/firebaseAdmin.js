const admin = require("firebase-admin");
const serviceAccount = require("../fast-marketing-87639-firebase-adminsdk-fbsvc-f36023b104.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
