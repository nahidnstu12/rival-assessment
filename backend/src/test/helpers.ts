import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { hashPassword } from "../utils/password.js";

export const app = createApp();

export async function createApprovedUser(email: string) {
  const password = await hashPassword("test1234");
  return prisma.user.upsert({
    where: { email },
    update: { status: "APPROVED", password },
    create: {
      name: "Test User",
      email,
      password,
      status: "APPROVED",
    },
  });
}

export async function loginAs(email: string) {
  const agent = request.agent(app);
  const res = await agent.post("/auth/login").send({
    email,
    password: "test1234",
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  return agent;
}

export async function cleanupTestData() {
  await prisma.task.deleteMany({
    where: { user: { email: { endsWith: "@test.local" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@test.local" } },
  });
}
