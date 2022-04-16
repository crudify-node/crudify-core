import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const seed = async () => {
  await prisma.$disconnect();
};
seed();
export default seed;
