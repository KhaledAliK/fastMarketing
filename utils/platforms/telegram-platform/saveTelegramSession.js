const prisma = require("../../../config/prisma");

async function saveTelegramSession({
  type,
  userId,
  session = "",
  phoneCodeHash,
  phoneNumber,
}) {
  const now = new Date();

  const createData = {
    session,
    phoneCodeHash,
    phoneNumber,
    codeSentAt: now,
  };

  if (type === "REGULAR_USER") {
    createData.user = { connect: { id: userId } };
  } else if (type === "SUPERVISOR") {
    createData.supervisor = { connect: { id: userId } };
  } else if (type === "SALES") {
    createData.sales = { connect: { id: userId } };
  } else if (type === "SUPER_ADMIN") {
    createData.superAdmin = { connect: { id: userId } };
  } else {
    throw new Error("❌ Unknown user type");
  }

  const whereClause = {};
  if (type === "REGULAR_USER") whereClause.userId = userId;
  else if (type === "SUPERVISOR") whereClause.supervisorId = userId;
  else if (type === "SALES") whereClause.salesId = userId;
  else if (type === "SUPER_ADMIN") whereClause.superAdminId = userId;

  const updated = await prisma.telegramSession.upsert({
    where: whereClause,
    update: {
      session,
      phoneCodeHash,
      phoneNumber,
      codeSentAt: now,
    },
    create: createData,
  });

  return updated;
}

module.exports = { saveTelegramSession };
