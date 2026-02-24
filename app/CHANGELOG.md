# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.5.0](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.4.0...v1.5.0) (2026-02-24)


### Features

* implement autobot functionality with interval checks and file tracking ([6d0ae01](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/6d0ae01aac1ab134db42c6f2d5dac9e7897b625e))
* implement autobot page and shared header component with dropdown menu ([ab76639](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/ab76639d20127a179e2088e208b7e3971710636d))
* update setup instructions for Node.js and Playwright installation ([9d32a5c](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/9d32a5cbc4430cf91f87113075ce4f2e2617665b))


### Bug Fixes

* increase max limit for batch size to improve upload flexibility ([35c59e7](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/35c59e77952607f374267f02c17e44f7291c63f3))
* update batch size tooltip for clarity on upload speed ([f749efd](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/f749efdba76805019ea3ca6bf2eb21434359cd39))

## [1.4.0](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.3.0...v1.4.0) (2026-02-22)


### Features

* enhance modals with z-index adjustments and add setup instructions for Playwright ([a737d69](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/a737d6967652a6fb1e9ad0cd4f46f98250941a23))
* refactor session management to use username instead of customerId ([a307ca9](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/a307ca9d35664dbaf6cbcb19f1bbfb9000d1637b))
* update invalidate session endpoint to remove admin prefix ([9342b29](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/9342b299628a21bb47a3a4a62f3a015b7c877f3f))


### Bug Fixes

* improve page loading reliability by switching to 'domcontentloaded' and adding timeout handling ([c14dfc1](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/c14dfc154e085a897c315981f3e84a035a1d1b06))
* update playwright version to remove caret for consistent installation ([6c4445e](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/6c4445ee7d9dd44aeaeb5e5123595c7d87a4dc7d))

## [1.3.0](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.2.0...v1.3.0) (2026-02-22)


### Features

* enhance setup modal with help and installation tabs for improved user guidance ([6e6c017](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/6e6c0173b36328e8ee7eac57b2fee7fb6b619454))
* implement upload cancellation checks throughout the upload process ([3871279](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/3871279c24dd489a07d08fb8a4235b1a2601b6a1))
* integrate @hapi/boom for improved error handling in customer routes and services ([97e5639](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/97e5639ca304483064b5da16973fa436f957a75c))
* integrate @hapi/boom for improved error handling in customer routes and services ([e33c5fc](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/e33c5fc9ba1f538382c333ca331e3cd008d70736))
* simplify conflict error message for existing customer sessions ([eb9c3d5](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/eb9c3d5e5465b5351b288bb365f06eb6291c04d6))

## [1.2.0](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.1.0...v1.2.0) (2026-02-21)


### Features

* add application icons for macOS, Windows, and Linux ([141e5d9](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/141e5d92c85a16cba2f1a49bcbe2951fd7ce3261))
* add batchSize field to customer model and update related routes for upload configuration ([3fc61b0](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/3fc61b03d74d938c40304da4a29762f327874262))
* add concurrentTabs field to customer model and update related routes ([6dfcaa0](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/6dfcaa001eab175cc45fd703abc3c7514df72b96))
* add concurrentTabs input field to CustomersPage for upload configuration ([79aa610](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/79aa610eff21289b2983830705c9441bfd3b16e6))
* add fotoTree field to customer model and update related routes for handling uploads ([6b27a12](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/6b27a12ffb0407fb85bfca2c0a04ff9ad6d65cf4))
* add login, dashboard, setup, and profile modals with handlers for user interaction ([05a70b7](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/05a70b7ff407b3d46083a68c984cbd5964146c34))
* add production environment configuration for API_URL ([308f374](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/308f3742444843cf77aa0b628a3f2aadf7e75f8e))
* add session management to loginCustomer function to prevent multiple active sessions ([27be423](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/27be42318483cdde5f2b4f030e2c578047e99496))
* configure dotenv to load environment variables based on production status ([ad1251c](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/ad1251cdb16bde76144a37b107de8b96870da45b))
* enhance user interface with FotoTree search and Playwright setup modal ([50a5e2d](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/50a5e2dfe52673f2b5c21a75d9e087e058b1df0c))
* implement concurrent upload functionality with multiple tabs for improved performance ([981222f](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/981222fade62c3ae245dd79f8e0bbdb7962f6cb2))
* implement upload cancellation feature via IPC handler ([a8450dc](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/a8450dc4a34cf5d7943d1683e32331a0f41c23ed))


### Bug Fixes

* correct comment for concurrent tabs in bot.js for clarity ([0387450](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/0387450ee5dc12809fee7202d030357b3e7aaff8))

## [1.1.0](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.0.5...v1.1.0) (2026-02-18)


### Features

* add env.js script for environment variable configuration ([b08fefa](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/b08fefa8b26d9a388e76b8e37541175bf7cb90ca))

### [1.0.5](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.0.4...v1.0.5) (2026-02-18)


### Bug Fixes

* update API_BASE_URL to use window.__ENV__ for environment variable access ([1528245](https://github.com/aharoldk/jawara-fotoyu-uploader/commit/152824501c908dc7277316fcc04f293c0f414b5b))

### [1.0.4](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.0.3...v1.0.4) (2026-02-18)

### [1.0.3](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.0.2...v1.0.3) (2026-02-18)

### [1.0.2](https://github.com/aharoldk/jawara-fotoyu-uploader/compare/v1.0.1...v1.0.2) (2026-02-18)

### 1.0.1 (2026-02-18)
