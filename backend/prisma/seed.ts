import { prisma } from "../src/db.js";
import { hashPassword } from "../src/utils/password.js";

async function main() {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword("demo1234");

  const admin = await prisma.user.create({
    data: {
      name: "Sabir Ahmed",
      email: "sabir@rival.io",
      password,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Tanvir Hasan",
      email: "tanvir@rival.io",
      password,
      role: "USER",
      status: "APPROVED",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Nadia Islam",
      email: "nadia@rival.io",
      password,
      role: "USER",
      status: "APPROVED",
    },
  });

  const pending = await prisma.user.create({
    data: {
      name: "Imran Kabir",
      email: "pending@rival.io",
      password,
      role: "USER",
      status: "PENDING",
    },
  });

  const seedTasks = [
    { title: "Design onboarding flow", status: "IN_PROGRESS" as const, priority: "HIGH" as const, userId: admin.id, order: 0 },
    { title: "Set up CI pipeline", status: "TODO" as const, priority: "MEDIUM" as const, userId: admin.id, order: 1 },
    { title: "Write API contract", status: "DONE" as const, priority: "LOW" as const, userId: admin.id, order: 2 },
    { title: "Review PR #42", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, userId: member1.id, order: 0 },
    { title: "Mobile drawer nav", status: "TODO" as const, priority: "MEDIUM" as const, userId: member2.id, order: 0 },
  ];

  for (const task of seedTasks) {
    await prisma.task.create({ data: task });
  }

  console.log("\nSeed complete. Demo password for all users: demo1234\n");
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Member:  ${member1.email}`);
  console.log(`  Member:  ${member2.email}`);
  console.log(`  Pending: ${pending.email}\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
