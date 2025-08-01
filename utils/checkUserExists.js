const prisma = require("../config/prisma");

const checkUserExists = async (email, phoneNumber, role) => {
  const existingEmail = await prisma[role].findUnique({ where: { email } });
  if (existingEmail) {
    return { exists: true, message: "User with this email already exists" };
  }

  const existingPhone = await prisma[role].findUnique({
    where: { phoneNumber },
  });
  if (existingPhone) {
    return { exists: true, message: "Phone number already exists" };
  }

  return { exists: false };
};

module.exports = checkUserExists;
