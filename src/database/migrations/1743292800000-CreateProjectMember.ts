import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial migration — creates all core tables:
 *   user, project, vote, feedback, project_member
 *
 * Each statement uses IF NOT EXISTS so the migration is safe to re-run.
 */
export class CreateProjectMember1743292800000 implements MigrationInterface {
  name = 'CreateProjectMember1743292800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extensions ──────────────────────────────────────────────
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );

    // ── Enums ───────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE "user_role_enum" AS ENUM ('participant', 'developer', 'admin');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status_enum') THEN
          CREATE TYPE "project_status_enum" AS ENUM ('pending', 'voting', 'in progress', 'maintenance', 'closed', 'declined');
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_category_enum') THEN
          CREATE TYPE "feedback_category_enum" AS ENUM ('platform', 'projects', 'community', 'other');
        END IF;
      END $$
    `);

    // ── user ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firebaseUid"       character varying NOT NULL,
        "email"             character varying NOT NULL,
        "gravatar"          character(32),
        "fullName"          character varying NOT NULL,
        "imageUrl"          character varying,
        "linkedInUrl"       character varying,
        "gitHubUrl"         character varying,
        "level"             integer NOT NULL DEFAULT 1,
        "membershipStatus"  character varying NOT NULL DEFAULT 'free',
        "role"              "user_role_enum" NOT NULL DEFAULT 'participant',
        "isBlocked"         boolean NOT NULL DEFAULT false,
        "projectsProposed"  integer NOT NULL DEFAULT 0,
        "projectsSupported" integer NOT NULL DEFAULT 0,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_firebaseUid" UNIQUE ("firebaseUid"),
        CONSTRAINT "UQ_user_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_isBlocked" ON "user" ("isBlocked")
    `);

    // ── project ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"             character varying NOT NULL,
        "slug"             character varying NOT NULL,
        "shortDescription" character varying NOT NULL,
        "description"      text NOT NULL,
        "status"           "project_status_enum" NOT NULL DEFAULT 'pending',
        "totalVotes"       integer NOT NULL DEFAULT 0,
        "totalVoters"      integer NOT NULL DEFAULT 0,
        "github"           character varying,
        "image"            character varying,
        "isBanned"         boolean NOT NULL DEFAULT false,
        "banNote"          character varying,
        "creatorId"        uuid NOT NULL,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_status" ON "project" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_totalVotes" ON "project" ("totalVotes")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_isBanned" ON "project" ("isBanned")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_creatorId" ON "project" ("creatorId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_createdAt" ON "project" ("createdAt")
    `);

    // ── vote ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vote" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"    uuid NOT NULL,
        "projectId" uuid NOT NULL,
        "weight"    integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vote_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vote_user_project" UNIQUE ("userId", "projectId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vote_userId" ON "vote" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vote_projectId" ON "vote" ("projectId")
    `);

    // ── feedback ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feedback" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"    uuid NOT NULL,
        "rating"    integer NOT NULL,
        "category"  "feedback_category_enum" NOT NULL,
        "message"   text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feedback_userId" ON "feedback" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feedback_createdAt" ON "feedback" ("createdAt")
    `);

    // ── project_member ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_member" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"     uuid NOT NULL,
        "projectId"  uuid NOT NULL,
        "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_member_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_member_user_project" UNIQUE ("userId", "projectId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_member_userId" ON "project_member" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_member_projectId" ON "project_member" ("projectId")
    `);

    // ── Foreign keys ────────────────────────────────────────────
    await this.addFkIfNotExists(
      queryRunner,
      'project',
      'FK_project_creatorId',
      `ALTER TABLE "project"
         ADD CONSTRAINT "FK_project_creatorId"
         FOREIGN KEY ("creatorId") REFERENCES "user"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await this.addFkIfNotExists(
      queryRunner,
      'vote',
      'FK_vote_userId',
      `ALTER TABLE "vote"
         ADD CONSTRAINT "FK_vote_userId"
         FOREIGN KEY ("userId") REFERENCES "user"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await this.addFkIfNotExists(
      queryRunner,
      'vote',
      'FK_vote_projectId',
      `ALTER TABLE "vote"
         ADD CONSTRAINT "FK_vote_projectId"
         FOREIGN KEY ("projectId") REFERENCES "project"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await this.addFkIfNotExists(
      queryRunner,
      'feedback',
      'FK_feedback_userId',
      `ALTER TABLE "feedback"
         ADD CONSTRAINT "FK_feedback_userId"
         FOREIGN KEY ("userId") REFERENCES "user"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await this.addFkIfNotExists(
      queryRunner,
      'project_member',
      'FK_project_member_userId',
      `ALTER TABLE "project_member"
         ADD CONSTRAINT "FK_project_member_userId"
         FOREIGN KEY ("userId") REFERENCES "user"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await this.addFkIfNotExists(
      queryRunner,
      'project_member',
      'FK_project_member_projectId',
      `ALTER TABLE "project_member"
         ADD CONSTRAINT "FK_project_member_projectId"
         FOREIGN KEY ("projectId") REFERENCES "project"("id")
         ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "project_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vote"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "feedback_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "project_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }

  private async addFkIfNotExists(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    alterSql: string,
  ): Promise<void> {
    const exists = await queryRunner.query(
      `SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = $1 AND table_name = $2`,
      [constraintName, table],
    );
    if (exists.length === 0) {
      await queryRunner.query(alterSql);
    }
  }
}
