const prisma = require("../config/prisma");

const deleteUnverifiedUsers = async () => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - 48);

    const deletedUsers = await prisma.superAdmin.deleteMany({
      where: {
        verified: false,
        createdAt: { lte: thresholdDate },
      },
    });

    console.log(`Deleted ${deletedUsers.count} unverified users older than 48 hours.`);
  } catch (error) {
    console.error("Error deleting unverified users:", error);
  }
};

module.exports = deleteUnverifiedUsers;
