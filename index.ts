// We're using ES modules instead of commonJS, you can change this in package.json
import express from "express";
const app = express();
import cors from "cors";
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
import prisma from "./joshuaprisma";
import { isTeacher, sessionValid } from "./server";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { runInNewContext } from "vm";
app.use(cors());
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
app.post("/judeup", async (req, res) => {
  const sessionId = req.body.sessionId;

  //const valid = await sessionValid(sessionId);

  if (sessionId == "notset") {
    const signupSchema = z.object({
      username: z.string().min(1).max(50),
      email: z.string().email(),
      password: z.string().min(1).max(50),
    });

    const { username, email, password, role } = req.body;

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
        teacher: role == "teacher" ? true : false,
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
  } else {
    res.json({
      alreadyLoggedIn: true,
    });
    return;
  }
});

function compareAsync(param1: string, param2: string) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(param1, param2, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

app.post("/judein", async (req, res) => {
  const sessionId = req.body.sessionId;

  //const valid = await sessionValid(sessionId);
  if (sessionId == "notset") {
    if (sessionId != undefined) {
      const session = await prisma.sessionId.findFirst({
        where: { sessionId },
      });
      const userid = session?.userId;
      if (userid != null) {
        res.json({ LoggedIn: true });
        res.end();
        return;
      }
    }
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user != null) {
      let response = await compareAsync(password, user.password);
      if (response) {
        const session = await prisma.sessionId.create({
          data: {
            userId: user.id,
            expiration: String(Date.now() + 43800 * 60000),
          },
        });

        if (session) {
          const userid: string = user.id;

          res.json({
            sucess: true,
            sessionId: session.sessionId,
            username: user.username,
            email: user.email,
            teacher: user.teacher,
          });

          return;
        } else {
          res.json({ success: false, message: "incorrect credentials" });
          return false;
        }
      } else {
        res.json({ success: false, message: "incorrect credentials" });
        return false;
      }
    } else {
      res.json({ alreadyLoggedIn: true });
    }
    //should prob check other stuff just in case
    return;
  }
});

app.post("/judeout", async (req, res) => {
  const sessionId = req.body.sessionId;
  if (sessionId != "notset") {
    try {
      const session = await prisma.sessionId.delete({
        where: {
          sessionId,
        },
      });
    } catch (error) {
      console.log(error);
      return;
    }
  }
});

app.post("/loadsurveys", async (req, res) => {
  const sessionId = req.body.sessionId;

  let teacher = await isTeacher(sessionId);

  if (teacher) {
    const surveys = await prisma.surveys.findMany({
      where: {
        teacherId: teacher,
      },
    });
    res.json({ sucess: true, surveys: surveys });
    return;
  } else {
    res.json({ notTeacher: true });
    return;
  }
});

app.listen(PORT, () => {
  console.log("app listening on port", PORT);
});
