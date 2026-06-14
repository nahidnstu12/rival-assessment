import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db.js";
import {
  app,
  cleanupTestData,
  createApprovedUser,
  loginAs,
} from "../test/helpers.js";

describe("tasks API", () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("returns 404 when user A reads user B task", async () => {
    await createApprovedUser("a@test.local");
    const userB = await createApprovedUser("b@test.local");
    const task = await prisma.task.create({
      data: { title: "B task", userId: userB.id },
    });

    const agentA = await loginAs("a@test.local");
    const res = await agentA.get(`/tasks/${task.id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 with error envelope when title is missing", async () => {
    await createApprovedUser("post@test.local");
    const agent = await loginAs("post@test.local");
    const res = await agent.post("/tasks").send({ description: "no title" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.any(String),
    });
    expect(res.body.error.details).toBeDefined();
  });
});

describe("health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
