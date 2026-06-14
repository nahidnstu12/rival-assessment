import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { readAuthToken, verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/errors.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readAuthToken(req);
  if (!token) {
    return sendError(res, 401, "UNAUTHORIZED", "Not authenticated");
  }

  try {
    const { userId } = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid user");
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.userStatus = user.status;
    next();
  } catch {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid token");
  }
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (req.userStatus !== "APPROVED") {
    const code = req.userStatus === "REJECTED" ? "ACCOUNT_REJECTED" : "PENDING_APPROVAL";
    const message =
      req.userStatus === "REJECTED"
        ? "This account was not approved"
        : "Account awaiting approval";
    return sendError(res, 403, code, message);
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    return sendError(res, 403, "FORBIDDEN", "Admin only");
  }
  next();
}
