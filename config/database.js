require("dotenv").config()

const prisma = require("./prisma");

console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL); // Debugging

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
};

module.exports = { connectDatabase };

