import { MigrationInterface, QueryRunner } from "typeorm";

export class FriendsAndMessages1746304279661 implements MigrationInterface {
    name = 'FriendsAndMessages1746304279661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "message" ("id" SERIAL NOT NULL, "content" text NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fromId" integer, "toId" integer, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friends_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "friends" ("id" SERIAL NOT NULL, "status" "public"."friends_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" integer, "receiverId" integer, CONSTRAINT "PK_65e1b06a9f379ee5255054021e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_75be436354d04247240601f5d4" ON "friends" ("senderId", "receiverId") `);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "avatarUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_776000050f42ddb61d3c628ff16" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_69b470efb1b19aca6e781214490" FOREIGN KEY ("toId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_3e161d03f97566f6de690f8c931" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_a1686285850a043d7a5a468440d" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_a1686285850a043d7a5a468440d"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_3e161d03f97566f6de690f8c931"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_69b470efb1b19aca6e781214490"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_776000050f42ddb61d3c628ff16"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "avatarUrl"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75be436354d04247240601f5d4"`);
        await queryRunner.query(`DROP TABLE "friends"`);
        await queryRunner.query(`DROP TYPE "public"."friends_status_enum"`);
        await queryRunner.query(`DROP TABLE "message"`);
    }

}
