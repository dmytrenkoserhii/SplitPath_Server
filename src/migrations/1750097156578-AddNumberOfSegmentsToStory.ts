import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNumberOfSegmentsToStory1750097156578 implements MigrationInterface {
    name = 'AddNumberOfSegmentsToStory1750097156578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ADD "numberOfSegments" integer`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_oauthId_key"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_oauthId_key" UNIQUE ("oauthId")`);
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "numberOfSegments"`);
    }

}
