# KidsLoop xAPI Service

[![codecov](https://codecov.io/gh/KL-Engineering/kidsloop-xapi-service/branch/master/graph/badge.svg?token=P3XMBOHL4J)](https://codecov.io/gh/KL-Engineering/kidsloop-xapi-service)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

---

## Remarks

Used by [kidsloop-h5p-library](https://github.com/KL-Engineering/kidsloop-h5p-library/blob/master/src/custom/xapiUploader.js) which sends us xAPI events, via the [h5p-xapi-uploader](https://github.com/KL-Engineering/h5p-xapi-uploader).

**Branching model**

- `feature/fix/etc` -> squash or rebase into `main`
- The main branch pipeline has a manual _release_ workflow.
- That workflow will build the docker image, push it to ECR, deploy to alpha, and create a GitHub release.
- GitHub prereleases are *upserted* in order to reduce changelog duplication.
- Slack notifications will be sent for non-prereleases.

📢 Follow the specification covered in [CONTRIBUTING.md](docs/CONTRIBUTING.md) 📢

## Design

### Vocabulary

- xAPI event: a raw [xAPI event](https://h5p.org/node/3391) (with the addition of a client timestamp) recevied from H5P
- xAPI record: an xAPI event wrapped in an object containing extra properties such as userId, ipHash, geolocation info, and server timestamp
- record sender: a class that implements the `IXapiRecordSender` interface, which specifies a single `sendRecords` method.

### Basic logic flow

`index.ts` creates a list of _record senders_, injects them into the `XapiEventDispatcher`, and then injects `XapiEventDispatcher` into the GraphQL Apollo Server. `XapiEventDispatcher` receives events from the GraphQL `sendEvents` mutation, maps those events to _records_, and then "dispatches" them by looping through all the senders.

### Current list of record senders

- AWS DynamoDB: This one is currently the most important because kidsloop-assessment-service reads from this table to calculate assessments.
- AWS Firehose: Long-term storage.
- AWS Elasticsearch: Events viewable from [Kibana](https://search-kidsloop-default-y5iifvhvcenbxnkknv2q3ovc5i.ap-northeast-2.es.amazonaws.com/_plugin/kibana/app/home#/). Accessible via Google Suite once you've been granted access. Only used in alpha-dev account.
- TypeORM (Postgres): For regions that don't support AWS.

---

## Local development

### Prerequisites

#### Installation

- Node v16.x.x
- Npm v6.x.x
- Docker

#### Configuration

env files are located in the `localDev` directory. View the [dotenv-flow](https://www.npmjs.com/package/dotenv-flow) docs for examples of how to customize environment variables.

All record sender implementations are optional, but at least one must be included. To exclude an implementation, comment out the corresponding environment variable in your `.env` file.

Run Docker Compose

```
docker compose -f localDev/docker-compose.yml --project-name xapi up
```

### Running

Ensure [AWS credentials are configured](https://aws.amazon.com/blogs/security/aws-single-sign-on-now-enables-command-line-interface-access-for-aws-accounts-using-corporate-credentials/) (for access to DynamoDB and Firehose)

Ensure all dependencies are installed

```
npm install
```

Ensure services are running

```
docker compose -p xapi start
```

Run

```
npm start
```

Run with hot reload

```
npm run dev
```

### Running in docker

Make sure to compile the Typescript into JS

```sh
npm run build
```

Next build the container

```sh
docker build -t kl-xapi .
```

Now run the container and make sure to pass it the right environment variables. For simplicity you can pass it your `.env` file that you use locally and then overwrite with `--env`

```sh
docker run --rm -it \
  --env-file localDev/.env \
  --env PORT=8080 \
  --env AWS_ACCESS_KEY_ID \
  --env AWS_SECRET_ACCESS_KEY \
  --env AWS_SESSION_TOKEN \
  --env XAPI_DATABASE_URL=postgres://postgres:kidsloop@host.docker.internal:5432/xapi_db \
  -p 8080:8080 \
  kl-xapi
```

PRO tip: replace `localhost` with `host.docker.internal` if you want to connect to a database outside the docker network. 

### Debugging

1. Navigate to the VS Code sidebar debug panel
2. Select `index.ts` from the dropdown
3. Click the green arrow debug button

### Testing

Run Docker Compose (only needed for integration tests)

```
docker compose up -f localDev/docker-compose.yml
```

Run unit tests and generate coverage report (`./coverage_unit/lcov-report/index.html`)

```
npm run coverage:unit
```

Run integration tests and generate coverage report (`./coverage_integration/lcov-report/index.html`)

```
npm run coverage:integration
```

Run all tests and generate coverage report (`./coverage/lcov-report/index.html`)

```
npm test
```

_Tip: when debugging or focusing on a particular test or group of tests, append `.only` to `describe`, `context`, or `it` to only execute that scope of tests. But of course, make sure to undo it before making a commit._

---

## Deployment

### Alpha info

- Account name: kl-alpha-dev
- Cluster: kidsloop-alpha
- Service: kidsloop-alpha-xapi
- Region: ap-northeast-2
- DynamoDB table: kidsloop-alpha-xapi-ace-ray
- Firehose stream: kidsloop-alpha-xapi-ace-ray

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/kidsloop-alpha-xapi/tasks), and you'll find the values specified in the latest task definition.

---

## Migrations

Use `typeorm` to generate and run migrations.

Docs:
- [typeorm - Migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md)
- [typeorm - Using CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md)

Generate `ormConfig.json`

```sh
METADATA_DATABASE_URL=[database_url] npm run generate-orm-config
```

Generate migration

```sh
npm run typeorm migration:generate -- --config ormConfig.json -n MigrationName
```

Manually run a migration:

```sh
npm run typeorm migration:run -- --config ormConfig.json
```

Revert a migration:

```sh
npm run typeorm migration:revert -- --config ormConfig.json
```
