import 'dotenv/config';
import { defineConfig, env } from '@prisma/config'; // Note: @prisma/config is included with prisma@7+

export default defineConfig({
  schema: 'prisma/schema.prisma', // Path to your schema
  migrations: {
    path: 'prisma/migrations', // Default
  },
  datasource: {
    url: env('DATABASE_URL'), // Required; throws if missing
    // Optional: shadowDatabaseUrl: env('SHADOW_DATABASE_URL') for migrations if needed
  },
});
