// We're using ES modules instead of commonJS, you can change this in package.json
import express from "express";
const app = express();
import cors from "cors";
var cookieParser = require("cookie-parser");
import prisma from "./joshuaprisma";
import { sessionValid } from "./server";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
app.use(cors());
app.use(cookieParser());
// You can set your port in the Secrets tab.
const PORT = process.env.PORT || 8080;

app.get("/hello", (req, res) => {
  res.send("Hello world!!");
});

app.post("/judeup", async (req, res) => {
  const { sessionId } = req.cookies;
  const valid = await sessionValid(sessionId);
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

    let result = await prisma.user.findFirst({ where: { email } });

    if (result != null) {
      res.json({ emailedUsed: true });
      return;
    }

    result = await prisma.user.findFirst({ where: { username } });

    if (result != null) {
      res.json({ usernameUsed: true });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        username,
      },
    });

    const session = await prisma.sessionId.create({
      data: {
        userId: user.id,
        expiration: String(Date.now() + 43800 * 60000),
      },
    });

    res.cookie(sessionId, session.sessionId, {
      expire: 60 * 60 * 24 * 365 + Date.now(),
    });

    //should prob check other stuff just in case
    res.json({ sucess: true });
  } else {
    res.json({
      alreadyLoggedIn: true,
    });
    return;
  }

  res.send("Hello world!!");
});
app.post("/judein", async (req, res) => {
  console.log(req.data);
  res.json({
    success: true,
    sessionId: "judedid " + "123",
  });
});

app.listen(PORT, () => {
  console.log("app listening on port", PORT);
});
