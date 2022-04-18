import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIsReviewColumn1650517452084 implements MigrationInterface {
  name = 'AddIsReviewColumn1650517452084'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The commented out line below is technically sufficient, but we have to use a
    // workaround to accommodate "Capture Data Changes (AWS DMS)" limitations for
    // default values. This was requested by the data team.
    // await queryRunner.query(
    //   `ALTER TABLE "xapi_record" ADD "is_review" boolean NOT NULL DEFAULT false`,
    // )
    await queryRunner.query(`ALTER TABLE "xapi_record" ADD "is_review" boolean`)
    await queryRunner.query(`UPDATE "xapi_record" SET "is_review" = false`)
    await queryRunner.query(
      `ALTER TABLE "xapi_record" ALTER COLUMN "is_review" SET NOT NULL, ALTER COLUMN "is_review" SET DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "xapi_record" DROP COLUMN "is_review"`)
  }
}
