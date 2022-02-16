import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDatabase1645001462771 implements MigrationInterface {
  name = 'CreateDatabase1645001462771'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "xapi_record" ("user_id" uuid NOT NULL, "server_timestamp" bigint NOT NULL, "room_id" character varying, "xapi" jsonb NOT NULL, "ip_hash" character varying NOT NULL, "geo" json, CONSTRAINT "PK_bb8861fe25a43d7f18e0b671dcd" PRIMARY KEY ("user_id", "server_timestamp"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "xapi_record"`)
  }
}
