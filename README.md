# H5P xAPI Server

[![codecov](https://codecov.io/bb/calmisland/h5p-xapi-server/branch/master/graph/badge.svg?token=53QIJCNIEF)](https://codecov.io/bb/calmisland/h5p-xapi-server)

[TOC]

---

## Remarks

Used by [kidsloop-h5p-library](https://bitbucket.org/calmisland/kidsloop-h5p-library/src/3d34fbc7f25c13b4b42f40bc3fb7c6726019aee1/src/xapi-uploader.ts?at=dev) which sends us xAPI events, via the [h5p-xapi-uploader](https://bitbucket.org/calmisland/h5p-xapi-uploader).

Branching model: `feature/fix/etc` -> `master` -> `alpha` -> `production`

Include Jira ticket IDs in your commit messages.

Add/update tests when making code modifications.

Merge conventions: Fast forward after rebasing, or squash if your branch has a lot of minor commits that would clutter the commit history.

We don't enforce conventional commits, but maybe at some point in the future. Regardless, the categorization can be useful for branch names, PR titles, or commit messages:

- `feat`: adds a new feature
- `fix`: fixes a bug
- `refactor`: restructures code, without functional changes
- `perf`: improves performance, without functional changes
- `docs`: adds or improves documentation
- `style`: white-space, formatting, missing semi-colons, etc.
- `test`: adds or updates tests
- `chore`: catch-all type for any other modifications

---

## Design

### Vocabulary

- xAPI event: a raw [xAPI event](https://h5p.org/node/3391) (with the addition of a client timestamp) recevied from H5P
- xAPI record: an xAPI event wrapped in an object containing extra properties such as userId, ipHash, geolocation info, and server timestamp
- record sender: a class that implements the `IXapiRecordSender` interface, which specifies a single `sendRecords` method.

### Basic logic flow

`entry.ts` creates a list of _record senders_, injects them into the `XapiEventDispatcher`, and then injects `XapiEventDispatcher` into the GraphQL Apollo Server. `XapiEventDispatcher` receives events from the GraphQL `sendEvents` mutation, maps those events to _records_, and then "dispatches" them by looping through all the senders.

### Current list of record senders

- AWS DynamoDB: This one is currently the most important because kidsloop-assessment-service reads from this table to calculate assessments.
- AWS Firehose: Long-term storage. Not actively queried at the time of writing.
- AWS ElasticSearch: Events viewable from [Kibana](https://search-kidsloop-default-y5iifvhvcenbxnkknv2q3ovc5i.ap-northeast-2.es.amazonaws.com/_plugin/kibana/app/home#/). Accessible via Google Suite once you've been granted access.
- TypeORM (Postgres): Currently in development. Motivation was getting rid of the DynamoDB AWS dependency for regions that don't support AWS.

---

## Local development

### Prerequisites

#### Installation

- Node v14.x.x
- Npm v6.x.x
- Docker (if you plan on testing ElasticSearch and/or Postgres)

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

All record sender implementations are optional, but at least one must be included. To exclude an implementation, comment out the corresponding environment variable in your `.env` file.

Create Postgres container

```
docker run -d --name=xapiserver-postgres -p 5443:5432 -e POSTGRES_PASSWORD=xapiserver -e POSTGRES_DB=xapi_db postgres
```

Create ElasticSearch container

```
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.5.2
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

### Debugging

1. Navigate to the VS Code sidebar debug panel
2. Select `entry.ts` from the dropdown
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

We use the [Bitbucket Deployments](https://bitbucket.org/blog/introducing-bitbucket-deployments) feature for a nice overview of deployment history. The quality of the Jira integration depends on ticket IDs being included in commit messages, so it's important to make an effort to do so.

- The [Bitbucket view](https://bitbucket.org/calmisland/h5p-xapi-server/addon/pipelines/deployments) can be accessed from the sidebar via the Deployments tab.
- The [Jira view](https://calmisland.atlassian.net/jira/software/c/projects/DAS/deployments?startDate=-3m&endDate=now) can be accessed from the sidebar of Jira via the Deployments tab.

The Bitbucket pipeline builds and pushes a new docker image to the _Kidsloop Infra_ account every time code is merged into the `alpha` or `production` branch. Making the actual deployment requires another step, which differs between alpha and production.

### Alpha

1. Head over to the [ECS service](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/kidsloop-alpha-xapi/details) in the _Kidsloop Dev_ account.
2. Click "Update" in the top right corner.
3. Check the "Force new deployment" checkbox.
4. Click "Skip to review"
5. Click "Update service.

### Production

Make a PR in the [kidsloop-infra](https://bitbucket.org/calmisland/kidsloop-infra/src/main/) repository, using [this merged PR](https://bitbucket.org/calmisland/kidsloop-infra/pull-requests/148) as a template.

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

- [Jira and Bitbucket](https://marketplace.visualstudio.com/items?itemName=Atlassian.atlascode)
- [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
