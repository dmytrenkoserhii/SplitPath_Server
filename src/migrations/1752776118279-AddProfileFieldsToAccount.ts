import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToAccount1752776118279 implements MigrationInterface {
  name = 'AddProfileFieldsToAccount1752776118279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" ADD "firstName" character varying`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD "lastName" character varying`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD "birthDate" date`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD "bio" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "birthDate"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "firstName"`);
  }
}
