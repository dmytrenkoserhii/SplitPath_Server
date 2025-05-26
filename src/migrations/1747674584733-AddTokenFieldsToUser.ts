import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenFieldsToUser1747674584733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "emailVerificationToken" text NULL,
            ADD COLUMN "resetPasswordToken" text NULL
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "users" 
        DROP COLUMN IF EXISTS "emailVerificationToken",
        DROP COLUMN IF EXISTS "resetPasswordToken"
      `);
  }
}
