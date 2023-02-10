import { PrismaClient } from "@prisma/client";
import e from "express";
import { setFlagsFromString } from "v8";

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

export async function isTeacher(sessionId: string) {
  let valid = await sessionValid(sessionId);

  if (valid) {
    const user = await prisma.user.findFirst({
      where: { id: valid },
    });

    if (user) {
      if (user.teacher) {
        user.id;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}
