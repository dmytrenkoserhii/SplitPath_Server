import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthIdToUser1746192252098 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "oauthId" text NULL UNIQUE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "oauthId";
    `);
  }
}
