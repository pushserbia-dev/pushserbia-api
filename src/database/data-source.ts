import { DataSource } from 'typeorm';
import 'dotenv/config';

/**
 * TypeORM DataSource used by the CLI for generating and running migrations.
 *
 * Usage (via package.json scripts):
 *   npm run migration:generate -- src/database/migrations/MigrationName
 *   npm run migration:run
 *   npm run migration:revert
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: !!process.env.DATABASE_CA_CERT,
          ca: process.env.DATABASE_CA_CERT || undefined,
        }
      : false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
