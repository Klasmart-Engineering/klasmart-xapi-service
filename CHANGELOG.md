# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.1.0..v1.0.0) (2021-11-18)


### Features

* **XAPI-6:** wrap resolver functions in transactions ([1385194](https://bitbucket.org/calmisland/h5p-xapi-server/commits/13851940458999d95573480721def36070668c12))


### Refactor

* **DAS-176:** extract express server creation out of index.ts ([b5fc147](https://bitbucket.org/calmisland/h5p-xapi-server/commits/b5fc147872230e9cf3883b2742d7d260c8c598e2))
* **DAS-176:** extract record sender initialization out of index.ts ([46ce1ee](https://bitbucket.org/calmisland/h5p-xapi-server/commits/46ce1ee17f80493889e3906d662f64eca2601a1f))
* **DAS-172:** replace auth.ts with kidsloop-token-validation library ([f1cb8e9](https://bitbucket.org/calmisland/h5p-xapi-server/commits/f1cb8e9af06794c84eafbf94ed88be4bff73aa0e))

## 1.0.0 (2021-10-18)


### Features

* **XAPI-5:** add newrelic package and basic integration at app startup ([f027feb](https://bitbucket.org/calmisland/h5p-xapi-server/commits/f027feb8cac761488021171a4c8e4c321337d4b1))
* create postgres database if it doesn't exist ([c712118](https://bitbucket.org/calmisland/h5p-xapi-server/commits/c712118b544b09e111758310116ba50f44e65b1d))
* **new-relic:** add typing declaration for @newrelic/apollo-server-plugin, fixed minor linter errors related to apollo plugin registration ([3b0a159](https://bitbucket.org/calmisland/h5p-xapi-server/commits/3b0a1592070edf1f3c0e30e311e9a3cc092d3ef4))
* **new-relic:** update Dockerfile to include ADD statement for type declaration folder to prevent failure on startup ([aa75804](https://bitbucket.org/calmisland/h5p-xapi-server/commits/aa7580415966350145958552f96da4b76d9e440a))
* use UUID type for userId and ignore unauthenticated events ([0fa32d1](https://bitbucket.org/calmisland/h5p-xapi-server/commits/0fa32d115d51b019459b76dcc79218126cd27b40))


### Bug Fixes

* **DAS-94,DAS-95:** failed event sending ([fc81c47](https://bitbucket.org/calmisland/h5p-xapi-server/commits/fc81c47eda5cba0e0172937b6ed87c3fa09f791c))
