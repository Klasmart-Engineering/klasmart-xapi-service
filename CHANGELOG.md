# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.0.0...v1.1.0) (2021-11-18)


### Features

* **new-relic:** wrap resolver functions in transactions ([1385194](https://bitbucket.org/calmisland/h5p-xapi-server/commit/13851940458999d95573480721def36070668c12))


### Bug Fixes

* elasticsearch not supported runtime error ([f536fa4](https://bitbucket.org/calmisland/h5p-xapi-server/commit/f536fa4ba58fc30a5a62a981a7fbc2cfde83e955))
* unable to find any GraphQL type definitions ([ca5052b](https://bitbucket.org/calmisland/h5p-xapi-server/commit/ca5052b44c1e8d4295dcf500b256c1522292f51f))


### Refactor

* extract express server creation out of index.ts ([b5fc147](https://bitbucket.org/calmisland/h5p-xapi-server/commit/b5fc147872230e9cf3883b2742d7d260c8c598e2))
* extract record sender initialization out of index.ts ([46ce1ee](https://bitbucket.org/calmisland/h5p-xapi-server/commit/46ce1ee17f80493889e3906d662f64eca2601a1f))
* replace auth.ts with kidsloop-token-validation library ([f1cb8e9](https://bitbucket.org/calmisland/h5p-xapi-server/commit/f1cb8e9af06794c84eafbf94ed88be4bff73aa0e))


### Build Changes

* copy dist into Docker and rename entry to index ([c5f1596](https://bitbucket.org/calmisland/h5p-xapi-server/commit/c5f15969bc497e158ee68bd1ee7186b8a2a3e6ef))
* update package.json to version 2 (node16) ([72c8b80](https://bitbucket.org/calmisland/h5p-xapi-server/commit/72c8b80f0b14936301e98e3a1d9fdc5e5973f44a))

## 1.0.0 (2021-10-18)


### Features

* add Kinesis record sender ([85ab058](https://bitbucket.org/calmisland/h5p-xapi-server/commit/85ab05809881a1d32f3a132f4c96d1e7ec2b7255))
* add newrelic package and basic integration at app startup ([f027feb](https://bitbucket.org/calmisland/h5p-xapi-server/commit/f027feb8cac761488021171a4c8e4c321337d4b1))
* create postgres database if it doesn't exist ([c712118](https://bitbucket.org/calmisland/h5p-xapi-server/commit/c712118b544b09e111758310116ba50f44e65b1d))
* **new-relic:** add typing declaration for @newrelic/apollo-server-plugin, fixed minor linter errors related to apollo plugin registration ([3b0a159](https://bitbucket.org/calmisland/h5p-xapi-server/commit/3b0a1592070edf1f3c0e30e311e9a3cc092d3ef4))
* **new-relic:** update Dockerfile to include ADD statement for type declaration folder to prevent failure on startup ([aa75804](https://bitbucket.org/calmisland/h5p-xapi-server/commit/aa7580415966350145958552f96da4b76d9e440a))
* use dependency injection to prep for testing ([3d0b3d6](https://bitbucket.org/calmisland/h5p-xapi-server/commit/3d0b3d6d0c5d7bdedd1ccb03338a44ac5d051671))
* use UUID type for userId and ignore unauthenticated events ([0fa32d1](https://bitbucket.org/calmisland/h5p-xapi-server/commit/0fa32d115d51b019459b76dcc79218126cd27b40))


### Bug Fixes

* failed event sending ([fc81c47](https://bitbucket.org/calmisland/h5p-xapi-server/commit/fc81c47eda5cba0e0172937b6ed87c3fa09f791c))
