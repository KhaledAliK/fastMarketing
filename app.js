const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const { connectDatabase } = require("./config/database");
const deleteUnverifiedUsers = require("./cron/deleteUnverifiedUsers");
const routes = require("./routes/index");
const { initSocket } = require("./webSocket/socket");
const { startSock } = require("./platforms/whatsapp-baileys/whatsapp");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);
cron.schedule("0 0 * * *", () => {
  console.log("Running cleanup job...");
  deleteUnverifiedUsers();
});

initSocket(server);

const PORT = process.env.PORT || 4001;
connectDatabase().then(() => {
  startSock();
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
