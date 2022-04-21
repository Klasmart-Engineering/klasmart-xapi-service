import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIsReviewColumn1650517452084 implements MigrationInterface {
  name = 'AddIsReviewColumn1650517452084'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "xapi_record" ADD "is_review" boolean`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "xapi_record" DROP COLUMN "is_review"`)
  }
}
