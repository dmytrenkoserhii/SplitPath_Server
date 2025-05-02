import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserColumns1746190162376 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isPremium" boolean NOT NULL DEFAULT false
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "isEmailVerified",
            DROP COLUMN IF EXISTS "isPremium"
        `);
  }
}
