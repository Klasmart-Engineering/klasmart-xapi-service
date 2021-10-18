# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
