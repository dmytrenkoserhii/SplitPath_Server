import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStoryUserCascade1747682401190 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "stories" 
            DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"
          `);

    await queryRunner.query(`
            ALTER TABLE "stories" 
            ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "stories" 
        DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"
      `);

    await queryRunner.query(`
        ALTER TABLE "stories" 
        ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id")
      `);
  }
}
