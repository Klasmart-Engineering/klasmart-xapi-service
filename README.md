# KidsLoop xAPI Service

[![codecov](https://codecov.io/bb/calmisland/h5p-xapi-server/branch/master/graph/badge.svg?token=53QIJCNIEF)](https://codecov.io/bb/calmisland/h5p-xapi-server)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

---

## Remarks

Used by [kidsloop-h5p-library](https://github.com/KL-Engineering/kidsloop-h5p-library/blob/master/src/custom/xapiUploader.js) which sends us xAPI events, via the [h5p-xapi-uploader](https://github.com/KL-Engineering/h5p-xapi-uploader).

**Branching model**

- `feature/fix/etc` -> `master`
- The master branch pipeline has a manual _version bump_ step.
- That step will build/push the docker image to ECR, and deploy to alpha.
- We no longer use the alpha or production branches.

📢 Follow the specification covered in [CONTRIBUTING.md](CONTRIBUTING.md) 📢

## Design

### Vocabulary

- xAPI event: a raw [xAPI event](https://h5p.org/node/3391) (with the addition of a client timestamp) recevied from H5P
- xAPI record: an xAPI event wrapped in an object containing extra properties such as userId, ipHash, geolocation info, and server timestamp
- record sender: a class that implements the `IXapiRecordSender` interface, which specifies a single `sendRecords` method.

### Basic logic flow

`index.ts` creates a list of _record senders_, injects them into the `XapiEventDispatcher`, and then injects `XapiEventDispatcher` into the GraphQL Apollo Server. `XapiEventDispatcher` receives events from the GraphQL `sendEvents` mutation, maps those events to _records_, and then "dispatches" them by looping through all the senders.

### Current list of record senders

- AWS DynamoDB: This one is currently the most important because kidsloop-assessment-service reads from this table to calculate assessments.
- AWS Firehose: Long-term storage. Not actively queried at the time of writing.
- AWS ElasticSearch: Events viewable from [Kibana](https://search-kidsloop-default-y5iifvhvcenbxnkknv2q3ovc5i.ap-northeast-2.es.amazonaws.com/_plugin/kibana/app/home#/). Accessible via Google Suite once you've been granted access.
- TypeORM (Postgres): Motivation was getting rid of the DynamoDB AWS dependency for regions that don't support AWS.

---

## Local development

### Prerequisites

#### Installation

- Node v16.x.x
- Npm v6.x.x
- Docker (if you plan on testing ElasticSearch and/or Postgres)

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

Copy/paste `.env.test.example` in the root directory, rename it to `.env.test`, and modify as necessary.

All record sender implementations are optional, but at least one must be included. To exclude an implementation, comment out the corresponding environment variable in your `.env` file.

Create Postgres container

```
docker run -d --name=postgres -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop -e POSTGRES_DB=xapi_db postgres
```

If you already have a Postgres container that you'd like to reuse, the database `xapi_db` will be created automatically.

Create ElasticSearch container

```
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.5.2
```

Create single node Redis container instance

```sh
docker run -it -d --net kidsloop --name kl_redis -p 6379:6379 redis:6-alpine
```

Create Redis Cluster container and connect to the 7000 port

```sh
export REDIS_CLUSTER_IP=0.0.0.0 # for Mac Users
docker run -it -d \
  --name redis_cluster \
  -e "IP=0.0.0.0" \
  -e "MASTERS=3" \
  -e "SLAVES_PER_MASTER=1" \
  -e "INITIAL_PORT=7000" \
  -p 7000-7005:7000-7005 \
  grokzen/redis-cluster:latest
```

### Running

Ensure [AWS credentials are configured](https://aws.amazon.com/blogs/security/aws-single-sign-on-now-enables-command-line-interface-access-for-aws-accounts-using-corporate-credentials/) (for access to DynamoDB and Firehose)

Ensure all dependencies are installed

```
npm install
```

Ensure Postgres is running

```
docker start xapiserver-postgres
```

Ensure ElasticSearch is running

```
docker start elasticsearch
```

Run

```
npm start
```

Run with nodemon

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
  --env-file .env \
  --env PORT=8080 \
  --env AWS_ACCESS_KEY_ID \
  --env AWS_SECRET_ACCESS_KEY \
  --env AWS_SESSION_TOKEN \
  --env XAPI_DATABASE_URL=postgres://postgres:kidsloop@kl_postgres:5432/xapi_db \
  -p 8080:8080 \
  kl-xapi
```

PRO tip: replace `localhost` with `host.docker.internal` if you want to connect to a database outside the docker network. 

### Debugging

1. Navigate to the VS Code sidebar debug panel
2. Select `index.ts` from the dropdown
3. Click the green arrow debug button

### Testing

Run unit tests

```
npm run test:unit
```

Run integration tests

```
npm run test:integration
```

Run both unit and integration tests

```
npm test
```

Run both unit and integration tests, and generate a local coverage report. Results can be viewed at `/test-results/coverage.lcov/lcov-report/index.html`. Useful for finding lines/branches that aren't covered.

```
npm run test:coverage
```

_Tip: when debugging or focusing on a particular test or group of tests, append `.only` to `describe`, `context`, or `it` to only execute that scope of tests. But of course, make sure to undo it before making a commit._

---

## Deployment

### Alpha info

- Account name: Kidsloop Dev
- Cluster: kidsloop-alpha
- Service: kidsloop-alpha-xapi
- Region: ap-northeast-2
- DynamoDB table: kidsloop-alpha-xapi-ace-ray
- Firehose stream: kidsloop-alpha-xapi-ace-ray

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/kidsloop-alpha-xapi/tasks), and you'll find the values specified in the latest task definition.

---

## Recommended VS Code extensions

- [Jira](https://marketplace.visualstudio.com/items?itemName=Atlassian.atlascode)
- [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)

## Migrations

Use `typeorm` to generate and run migrations.

Docs:
- [typeorm - Migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md)
- [typeorm - Using CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md)

To generate a migration, make sure there's an `ormConfig.json` file present. You can generate it with the `./scripts/generateOrmConfig.ts` script. Then run the following:

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
