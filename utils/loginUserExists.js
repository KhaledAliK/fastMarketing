const prisma = require("../config/prisma");
const loginUserExists = async (email) => {
  const tables = [
    { model: prisma.superAdmin, role: "SUPER_ADMIN" },
    { model: prisma.supervisor, role: "SUPERVISOR" },
    { model: prisma.sales, role: "SALES" },
    { model: prisma.regularUser, role: "REGULAR_USER" },
  ];
  for (const { model, role } of tables) {
    const user = await model.findUnique({ where: { email } });
    if (user) {
      return { exists: true, user, role };
    }
  }
  return { exists: false, user: null, role: null };
};
module.exports = { loginUserExists };
