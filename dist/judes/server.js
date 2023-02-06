var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export function sessionValid(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (sessionId != null) {
            const session = yield prisma.sessionId.findUnique({ where: { sessionId } });
            if (session != null) {
                const userId = session.userId;
                const expiration = session.expiration;
                if (Number(expiration) <= Date.now()) {
                    yield prisma.sessionId.deleteMany({ where: { sessionId } });
                    return false;
                }
                else {
                    return userId;
                }
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    });
}
//# sourceMappingURL=server.js.map