import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGlobalChatMessageEntity1752001957663 implements MigrationInterface {
  name = 'AddGlobalChatMessageEntity1752001957663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "global_chat_message" ("id" SERIAL NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fromId" integer, CONSTRAINT "PK_83a39e2930df6678066c047a3da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_chat_message" ADD CONSTRAINT "FK_617114fb137d1eadacf7f421d75" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "global_chat_message" DROP CONSTRAINT "FK_617114fb137d1eadacf7f421d75"`,
    );
    await queryRunner.query(`DROP TABLE "global_chat_message"`);
  }
}
