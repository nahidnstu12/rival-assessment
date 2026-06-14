import { Router } from "express";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, signupSchema } from "../schemas/auth.schema.js";
import { sendError } from "../utils/errors.js";
import { clearAuthCookie, readAuthToken, setAuthCookie, signToken, verifyToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { serializeUser } from "../utils/user.js";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 409, "EMAIL_EXISTS", "An account with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        status: "PENDING",
      },
    });

    setAuthCookie(res, signToken(user.id));
    res.status(201).json({
      user: serializeUser(user),
      pendingApproval: true,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (user.status === "PENDING") {
      return sendError(res, 403, "PENDING_APPROVAL", "Account awaiting approval");
    }
    if (user.status === "REJECTED") {
      return sendError(res, 403, "ACCOUNT_REJECTED", "This account was not approved");
    }

    setAuthCookie(res, signToken(user.id));
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.get("/me", async (req, res, next) => {
  try {
    const token = readAuthToken(req);
    if (!token) {
      return res.json({ user: null });
    }

    let userId: string;
    try {
      userId = verifyToken(token).userId;
    } catch {
      clearAuthCookie(res);
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      clearAuthCookie(res);
      return res.json({ user: null });
    }

    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});
