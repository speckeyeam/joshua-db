var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
const app = express();
import cors from "cors";
var cookieParser = require("cookie-parser");
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { sessionValid } from "./judes/server";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
app.use(cors());
app.use(cookieParser());
const PORT = process.env.PORT || 8080;
app.get("/hello", () => {
});
app.post("/judeup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.cookies;
    const valid = yield sessionValid(sessionId);
    if (!valid) {
        const signupSchema = z.object({
            username: z.string().min(1).max(50),
            email: z.string().email(),
            password: z.string().min(1).max(50),
        });
        const { username, email, password } = signupSchema.parse({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        });
        let result = yield prisma.user.findFirst({ where: { email } });
        if (result != null) {
            res.json({ emailedUsed: true });
            return;
        }
        result = yield prisma.user.findFirst({ where: { username } });
        if (result != null) {
            res.json({ usernameUsed: true });
            return;
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const user = yield prisma.user.create({
            data: {
                email,
                password: hash,
                username,
            },
        });
        const session = yield prisma.sessionId.create({
            data: {
                userId: user.id,
                expiration: String(Date.now() + 43800 * 60000),
            },
        });
        res.cookie(sessionId, session.sessionId, {
            expires: new Date(Date.now() + 60 * 60 * 24 * 365),
        });
        res.json({ sucess: true });
    }
    else {
        res.json({
            alreadyLoggedIn: true,
        });
        return;
    }
    res.send("Hello world!!");
}));
app.post("/judein", () => __awaiter(void 0, void 0, void 0, function* () {
}));
app.listen(PORT, () => {
    console.log("app listening on port", PORT);
});
//# sourceMappingURL=index.js.map