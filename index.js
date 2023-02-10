"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// We're using ES modules instead of commonJS, you can change this in package.json
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const joshuaprisma_1 = __importDefault(require("./joshuaprisma"));
const server_1 = require("./server");
const bcrypt = __importStar(require("bcryptjs"));
const zod_1 = require("zod");
app.use((0, cors_1.default)());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
// You can set your port in the Secrets tab.
const PORT = process.env.PORT || 8080;
/*app.get("/hello", (req, res) => {
  res.send("Hello world!!");
});
*/
app.post("/judeup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.body.sessionId;
    //const valid = await sessionValid(sessionId);
    if (sessionId == "notset") {
        const signupSchema = zod_1.z.object({
            username: zod_1.z.string().min(1).max(50),
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(1).max(50),
        });
        const { username, email, password, role } = req.body;
        let result = yield joshuaprisma_1.default.user.findFirst({ where: { email } });
        if (result != null) {
            res.json({ emailedUsed: true });
            return;
        }
        result = yield joshuaprisma_1.default.user.findFirst({ where: { username } });
        if (result != null) {
            res.json({ usernameUsed: true });
            return;
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const user = yield joshuaprisma_1.default.user.create({
            data: {
                email,
                password: hash,
                teacher: role == "teacher" ? true : false,
                username,
            },
        });
        const session = yield joshuaprisma_1.default.sessionId.create({
            data: {
                userId: user.id,
                expiration: String(Date.now() + 43800 * 60000),
            },
        });
        res.cookie(sessionId, session.sessionId, {
            expires: new Date(Date.now() + 60 * 60 * 24 * 365),
        });
        //should prob check other stuff just in case
        res.json({
            sucess: true,
            sessionId: session.sessionId,
            username: user.username,
            email: user.email,
        });
        return;
    }
    else {
        res.json({
            alreadyLoggedIn: true,
        });
        return;
    }
}));
function compareAsync(param1, param2) {
    return new Promise(function (resolve, reject) {
        bcrypt.compare(param1, param2, function (err, res) {
            if (err) {
                reject(err);
            }
            else {
                resolve(res);
            }
        });
    });
}
app.post("/judein", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.body.sessionId;
    //const valid = await sessionValid(sessionId);
    if (sessionId == "notset") {
        if (sessionId != undefined) {
            const session = yield joshuaprisma_1.default.sessionId.findFirst({
                where: { sessionId },
            });
            const userid = session === null || session === void 0 ? void 0 : session.userId;
            if (userid != null) {
                res.json({ LoggedIn: true });
                res.end();
                return;
            }
        }
        const { email, password } = req.body;
        const user = yield joshuaprisma_1.default.user.findFirst({
            where: {
                email,
            },
        });
        if (user != null) {
            let response = yield compareAsync(password, user.password);
            if (response) {
                const session = yield joshuaprisma_1.default.sessionId.create({
                    data: {
                        userId: user.id,
                        expiration: String(Date.now() + 43800 * 60000),
                    },
                });
                if (session) {
                    const userid = user.id;
                    res.json({
                        sucess: true,
                        sessionId: session.sessionId,
                        username: user.username,
                        email: user.email,
                        teacher: user.teacher,
                    });
                    return;
                }
                else {
                    res.json({ success: false, message: "incorrect credentials" });
                    return false;
                }
            }
            else {
                res.json({ success: false, message: "incorrect credentials" });
                return false;
            }
        }
        else {
            res.json({ alreadyLoggedIn: true });
        }
        //should prob check other stuff just in case
        return;
    }
}));
app.post("/judeout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.body.sessionId;
    if (sessionId != "notset") {
        try {
            const session = yield joshuaprisma_1.default.sessionId.delete({
                where: {
                    sessionId,
                },
            });
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
}));
app.post("/loadsurveys", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.body.sessionId;
    let teacher = yield (0, server_1.isTeacher)(sessionId);
    if (teacher) {
        const surveys = yield joshuaprisma_1.default.surveys.findMany({
            where: {
                teacherId: teacher,
            },
        });
        res.json({ sucess: true, surveys: surveys });
        return;
    }
    else {
        res.json({ notTeacher: true });
        return;
    }
}));
app.listen(PORT, () => {
    console.log("app listening on port", PORT);
});
