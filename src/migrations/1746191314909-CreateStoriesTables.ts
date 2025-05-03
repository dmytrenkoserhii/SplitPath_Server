import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoriesTables1746191314909 implements MigrationInterface {
  name = 'CreateStoriesTables1746191314909';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "story_segments" ("id" SERIAL NOT NULL, "text" text NOT NULL, "choices" text NOT NULL, "selectedChoice" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "storyId" integer, CONSTRAINT "PK_a4d46cf7bec466fc06738dd32f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "story_topics" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_593901235ef1c6c997faa26e807" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stories_status_enum" AS ENUM('new', 'in-progress', 'finished')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stories" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "status" "public"."stories_status_enum" NOT NULL DEFAULT 'new', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "storyTopicId" integer, CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_segments" ADD CONSTRAINT "FK_9089f57d10cb30f1f4ea3231a68" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_be6d737b52bfafe03f9df6a4106" FOREIGN KEY ("storyTopicId") REFERENCES "story_topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_be6d737b52bfafe03f9df6a4106"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_segments" DROP CONSTRAINT "FK_9089f57d10cb30f1f4ea3231a68"`,
    );
    await queryRunner.query(`DROP TABLE "stories"`);
    await queryRunner.query(`DROP TYPE "public"."stories_status_enum"`);
    await queryRunner.query(`DROP TABLE "story_topics"`);
    await queryRunner.query(`DROP TABLE "story_segments"`);
  }
}
