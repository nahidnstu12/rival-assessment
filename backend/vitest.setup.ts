import "dotenv/config";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-min-32-chars-for-testing-only";
}
