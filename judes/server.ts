import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sessionValid(sessionId: string) {
  if (sessionId != null) {
    const session = await prisma.sessionId.findUnique({ where: { sessionId } });

    if (session != null) {
      const userId = session.userId;
      const expiration = session.expiration;

      if (Number(expiration) <= Date.now()) {
        await prisma.sessionId.deleteMany({ where: { sessionId } });
        return false;
      } else {
        return userId;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}
