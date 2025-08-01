const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @param {string} email - User's email
 * @returns {Object} - User object and table name
 * @desc Find user dynamically across all tables
 */

const userTables = ["superAdmin", "regularUser", "supervisor", "sales"];
async function findUserByEmail(email) {
  for (const table of userTables) {
    const user = await prisma[table].findUnique({ where: { email } });
    if (user) {
      return { user, table };
    }
  }
  return { user: null, table: null };
}
module.exports = findUserByEmail;
