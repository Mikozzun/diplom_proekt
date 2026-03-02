import 'dotenv/config';
import { defineConfig, env } from '@prisma/config'; // Note: @prisma/config is included with prisma@7+

export default defineConfig({
  schema: 'prisma/schema.prisma', // Path to your schema
  migrations: {
    path: 'prisma/migrations', // Default
  },
  datasource: {
    url: env('DIRECT_URL'), // Direct connection for migrations (bypasses PgBouncer)
  },
});
