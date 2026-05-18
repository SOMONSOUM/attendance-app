import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "mysql://root:root@localhost:3307/attendance?schema=public",
  },
});
