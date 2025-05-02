import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenToUser1746192252097 implements MigrationInterface {
    name = 'AddRefreshTokenToUser1746192252097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
    }

}
