// const { PrismaClient } = require("@prisma/client");

// let prisma;

// const prismaClientSingleton = function () {
//   if (!prisma) {
//     prisma = new PrismaClient();
//   }
//   return prisma;
// };

// module.exports = prismaClientSingleton();

const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

module.exports = prisma;

