import jwt from "jsonwebtoken";

const COOKIE_NAME = "token";

export type SessionPayload = {
  userId: string;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return value;
}

export function signToken(userId: string) {
  return jwt.sign({ userId } satisfies SessionPayload, secret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload {
  return jwt.verify(token, secret()) as SessionPayload;
}

export const authCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

export function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(authCookie.name, token, authCookie.options);
}

export function clearAuthCookie(res: import("express").Response) {
  res.clearCookie(authCookie.name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function readAuthToken(req: import("express").Request) {
  return req.cookies?.[authCookie.name] as string | undefined;
}
