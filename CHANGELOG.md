# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.8.1](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.8.1..v1.8.0) (2022-04-15)


### Refactor

* use ioredis instead of redis to support NAT mapping for Redis in Cluster mode ([759495a](https://bitbucket.org/calmisland/h5p-xapi-server/commits/759495ab454cc7177a94fb15d9f97472ccafa7af))

## [1.8.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.8.0..v1.7.1) (2022-04-14)


### Features

* add Redis record stream record sender ([605ff64](https://bitbucket.org/calmisland/h5p-xapi-server/commits/605ff648f8a8965447f50a410cc5441946a34fc4))

### [1.7.1](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.7.1..v1.7.0) (2022-04-05)


### Refactor

* decrease verboseness of debug logs ([ae539a5](https://bitbucket.org/calmisland/h5p-xapi-server/commits/ae539a5052155b7f4e857f2c8ae04ac5a18e87e6))

## [1.7.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.7.0..v1.6.0) (2022-04-05)


### Features

* **H5P-555:** use classActiveUserId for xAPI events ([b535e55](https://bitbucket.org/calmisland/h5p-xapi-server/commits/b535e555441314daeaad175d0a905ea07832d11c))


### Refactor

* utilize type guard helper ([3094268](https://bitbucket.org/calmisland/h5p-xapi-server/commits/309426897477d8fb29278b0db53c2f8224330e7b))

## [1.6.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.6.0..v1.5.0) (2022-03-23)


### Features

* enable Postgres database migrations + CreateDatabase migration ([504b2d3](https://bitbucket.org/calmisland/h5p-xapi-server/commits/504b2d3325b95da3df5b13d326bfbdf55cceee84))
* **kinesisDataStreams:** add KinesisDataStreams RecordSender ([49da8fa](https://bitbucket.org/calmisland/h5p-xapi-server/commits/49da8fa7a4469b0557cdafd2fee7bb6477501476))


### Bug Fixes

* dispatchEvents returns true if a record sender returns false ([ebe0d40](https://bitbucket.org/calmisland/h5p-xapi-server/commits/ebe0d4078f5b6dc1969b1dcc99be85b90e9d4db2))

## [1.5.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.5.0..v1.4.2) (2022-02-04)


### Features

* disable graphql playground in production ([6ac8eda](https://bitbucket.org/calmisland/h5p-xapi-server/commits/6ac8eda585ad47b49bc3d8b5e3005701f6c31a76))

### [1.4.2](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.4.2..v1.4.1) (2022-01-25)


### Performance

* **DAS-248:** reduce unnecessary typeorm query statements ([c722f3a](https://bitbucket.org/calmisland/h5p-xapi-server/commits/c722f3a9816e98f6ca796e0064cc4d8804805367))

### [1.4.1](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.4.1..v1.4.0) (2022-01-24)

## [1.4.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.4.0..v1.3.0) (2022-01-20)


### Features

* **XAPI-9:** add docs pages with express and jade templates ([6346062](https://bitbucket.org/calmisland/h5p-xapi-server/commits/634606260762ab5d6a66bea0df66af638552b496))


### Bug Fixes

* **build:** copy views files into docker container + fix directory structure ([afdf4ac](https://bitbucket.org/calmisland/h5p-xapi-server/commits/afdf4ace6575a7e9a01294c36e047846636131c1))

## [1.3.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.3.0..v1.2.0) (2022-01-04)


### Features

* **H5P-423:** include roomId in xapi records if present ([c123e8e](https://bitbucket.org/calmisland/h5p-xapi-server/commits/c123e8e9db0a9e48746a4baca86b2c6156a8d23b))


### Bug Fixes

* dynamodb sendLoop function not awaited ([05f9509](https://bitbucket.org/calmisland/h5p-xapi-server/commits/05f95092433601cb532e44c4abe96f82a265d968))
* firehose logs code instead of error ([9ec9f60](https://bitbucket.org/calmisland/h5p-xapi-server/commits/9ec9f60eaff19dbc499d6850be3b24e60bcab896))
* **H5P-423:** not receiving live authorization token header ([133e472](https://bitbucket.org/calmisland/h5p-xapi-server/commits/133e47288c9ce830d872d7ae81e2cafa1a8e806d))
* ip hash creation throws error because ip is undefined (local dev only) ([66dee32](https://bitbucket.org/calmisland/h5p-xapi-server/commits/66dee329996cb193b83fb315c362196805c8a5a0))


### Performance

* **H5P-427:** [typeorm] replace loop with a single api call ([390d00d](https://bitbucket.org/calmisland/h5p-xapi-server/commits/390d00de80149bdb3ba254135013038e47e1d9bf))


### Refactor

* **DAS-152:** add some debug logs ([d08c6e2](https://bitbucket.org/calmisland/h5p-xapi-server/commits/d08c6e2d6f0ab734de40f672926ae3aa97864227))
* **DAS-152:** experiment with a convenience error logging function ([71a0f99](https://bitbucket.org/calmisland/h5p-xapi-server/commits/71a0f99002dc5e7d807610b21fcf9a72f07a1619))
* **DAS-152:** improve logging ([270e8cd](https://bitbucket.org/calmisland/h5p-xapi-server/commits/270e8cd8f6bc9c6cbeee3b659e6d864c06b130d7))
* include credentials by default in playground ([2c72e39](https://bitbucket.org/calmisland/h5p-xapi-server/commits/2c72e391ca38aa39d56d79394e18696f045c2d76))
* organize server creation scripts into new initialization folder ([4c7e32b](https://bitbucket.org/calmisland/h5p-xapi-server/commits/4c7e32bf125fd9a572a8e9b891c84ee8b69a343d))
* remove try/catch from context function ([d4836e2](https://bitbucket.org/calmisland/h5p-xapi-server/commits/d4836e28e8f5104d096c599e5b40b6db8533b6a6))
* share authentication cookie code ([4488239](https://bitbucket.org/calmisland/h5p-xapi-server/commits/448823929a16e172e9cd0cb54fc2e5634e6052d2))
* use new elasticsearch type definitions ([76cf2bf](https://bitbucket.org/calmisland/h5p-xapi-server/commits/76cf2bf0c0467d345b836e9f58b44f2a1a8e87cf))
* use read-only collections where applicable ([c00cc8d](https://bitbucket.org/calmisland/h5p-xapi-server/commits/c00cc8db673164928d0c3cb935ff96dc9e647228))

## [1.2.0](https://bitbucket.org/calmisland/h5p-xapi-server/compare/v1.2.0..v1.1.0) (2021-12-06)


### Features

* **XAPI-7:** integrate kidsloop-nodejs-logger ([681c5f9](https://bitbucket.org/calmisland/h5p-xapi-server/commits/681c5f9be0a98c166e21a39ce776610953ef40dd))

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
