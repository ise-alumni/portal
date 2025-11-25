## [1.2.0](https://github.com/bxrne/ise-alumni/compare/v1.1.2...v1.2.0) (2025-11-25)

### Features

* **supabase:** create reminders table ([d7763b5](https://github.com/bxrne/ise-alumni/commit/d7763b5bfbd9466827fb0c70349c053e5e7c29fe))

### Bug Fixes

* **profile:** Add gawk related attributes to profile ([2e97464](https://github.com/bxrne/ise-alumni/commit/2e974641b73dbb0e6aa84fcc2ee253d1962a6ce8))

## [1.1.2](https://github.com/bxrne/ise-alumni/compare/v1.1.1...v1.1.2) (2025-11-25)

### Bug Fixes

* **dashboard:** profile photos and counts for alum ([2fd20d8](https://github.com/bxrne/ise-alumni/commit/2fd20d8eb13e671e230326406781fcbd82a1ee59))

## [1.1.1](https://github.com/bxrne/ise-alumni/compare/v1.1.0...v1.1.1) (2025-11-25)

### Bug Fixes

* Add better favicon (tbf) and dash page ([6f55859](https://github.com/bxrne/ise-alumni/commit/6f55859319f0b34bbe30c886c6b849ef76648188))
* **dashboard:** Added basic dashboard tabs with domain funcs ([94c6954](https://github.com/bxrne/ise-alumni/commit/94c6954bd222238499d7a21e235ac04f3d08effb))
* Fix tests and linting for dashboard ([c4c9b49](https://github.com/bxrne/ise-alumni/commit/c4c9b4934b7210059c5994ade27358bda3fbc54d))
* **test:** fix mocking in residency tests for domain ([bb878e5](https://github.com/bxrne/ise-alumni/commit/bb878e5fab343fd567af55f256ffd08603e4158b))

## [1.1.0](https://github.com/bxrne/ise-alumni/compare/v1.0.1...v1.1.0) (2025-11-22)

### Features

* **integrations, migrations:** Add profile history via stored proc ([a5b9567](https://github.com/bxrne/ise-alumni/commit/a5b95677c2c846794ef872f4fbad69e7e110facc))

## [1.0.1](https://github.com/bxrne/ise-alumni/compare/v1.0.0...v1.0.1) (2025-11-22)

### Bug Fixes

* **.releaserc.json:** ignore bad msgs ([f2f83d3](https://github.com/bxrne/ise-alumni/commit/f2f83d3ca8bbc018ed0fa4f573bc2df7cd6e957a))

## 1.0.0 (2025-11-22)

### Features

* better links and created profile pages and tidied announcements ([c647d2f](https://github.com/bxrne/ise-alumni/commit/c647d2f279b21a49fbd048f2185cd98707eaa72f))
* **directory, profiles:** Added directory search, email protection, … ([#10](https://github.com/bxrne/ise-alumni/issues/10)) ([ab895e2](https://github.com/bxrne/ise-alumni/commit/ab895e2a63eb616b00e1a5b8065d10944b4a872b))
* events fixed, announcements added, sample data ([4fde677](https://github.com/bxrne/ise-alumni/commit/4fde67746c36a320e25c84b13fb375056bff2d9f))
* initial commit ([a53cfe5](https://github.com/bxrne/ise-alumni/commit/a53cfe5f9023c3561f447172c1fd2ab435353f0f))
* **lib:** user types, announcment types, event tags are pulled from db as constants ([82a50b6](https://github.com/bxrne/ise-alumni/commit/82a50b631303da0b6696d0c3cb6ccc0809b0f316))

### Bug Fixes

* **.github:** use pnpm for ci ([b17561a](https://github.com/bxrne/ise-alumni/commit/b17561a67d2b4a238c2090d04ae5d1245c8a7fa5))
* **.github:** workflows tidied up ([6f48529](https://github.com/bxrne/ise-alumni/commit/6f48529795a865cd031dd87c13795bf9b4695c31))
* add images to announcements and events (defaults to random behance image) ([225dfe0](https://github.com/bxrne/ise-alumni/commit/225dfe0eae911545fff8c6a77523e550d608ce3f))
* address linting complaints ([35be88e](https://github.com/bxrne/ise-alumni/commit/35be88e52e8d5bba51146d19a04c21de6b9e1c42))
* **AnnouncementDetail, EventDetail:** Fix text on detail pages ([f98ea29](https://github.com/bxrne/ise-alumni/commit/f98ea292ac53863ffbb2ebf99fb4ea1d5e6ef291))
* **AnnouncementDetail:** respect email_visible ([9431a48](https://github.com/bxrne/ise-alumni/commit/9431a487c7d366db8d6f06a1c3eea42e34445ec5))
* **AnnouncementDetail:** Tag and slug fixes ([dfd89c4](https://github.com/bxrne/ise-alumni/commit/dfd89c4db603b446320945d708eac31c98beae14))
* **Announcements, Events:** fix loading text ([f09cf83](https://github.com/bxrne/ise-alumni/commit/f09cf8312a7016c686bcb2ba28a185b7084b9f7d))
* **Announcements, Map:** Add proper buttons to announcements, fix map placeholder layout ([ccf752f](https://github.com/bxrne/ise-alumni/commit/ccf752f85426a34c1c9ac09a1d230f75b03ad673))
* **announcements:** Fix tagging and announcement creatio ([3f0adab](https://github.com/bxrne/ise-alumni/commit/3f0adabd6da90e2e9e9488f8c36fcd5d58359413))
* **announcements:** make pagination a la events ([0c82ae8](https://github.com/bxrne/ise-alumni/commit/0c82ae8bde8dfaab45899561de84ce46bd3bbe27))
* **announcements:** use organiser id ([c82cf3a](https://github.com/bxrne/ise-alumni/commit/c82cf3aef117bf4c6574271654f2bcb97faaa792))
* **Announcments:** Update tests and announcements use tags now ([70d9701](https://github.com/bxrne/ise-alumni/commit/70d9701a9d9fe9413bea94699e6e1236cd17426d))
* **auth, lock, features:** update deps, added featflags for signup ([36302ca](https://github.com/bxrne/ise-alumni/commit/36302ca103791df0353f95284ae30bbbc520b1fc))
* **cd.yml:** add deps ([6f30ba3](https://github.com/bxrne/ise-alumni/commit/6f30ba300018b173fd619e20714d6436e770d83e))
* **cd.yml:** remove stray with ([7db27ed](https://github.com/bxrne/ise-alumni/commit/7db27ed42d28d0ad12240e499d03474ec3f7bcb4))
* **cd.yml:** use PAT ([e573884](https://github.com/bxrne/ise-alumni/commit/e573884f9356b10d9c9207e42d2376133a3b7292))
* **ci.yml:** add perms and token on checkout ([f829684](https://github.com/bxrne/ise-alumni/commit/f82968496c8b862ef22703d751b74cdd680b7250))
* **Directory:** DOM invalid due to nested div in p ([f2b0f13](https://github.com/bxrne/ise-alumni/commit/f2b0f1394fa055702367f526bad21433209a9796))
* **Directory:** Hide MSc/BSc if profile is Staff ([8d1dd68](https://github.com/bxrne/ise-alumni/commit/8d1dd68d07039b2070fd0c9e71a036781b99ac79))
* **directory:** moved load for filtering to client ([77e9ee8](https://github.com/bxrne/ise-alumni/commit/77e9ee8740750f9d5fcc6cf66e5b6b23ee258919))
* **Directory:** use placeholdr profile pics w initials ([8eb0259](https://github.com/bxrne/ise-alumni/commit/8eb0259f52736646ca118fd10654c6bccd0e39bc))
* **EditEvent, EditAnnouncement:** Fixed tagging display ([8eda950](https://github.com/bxrne/ise-alumni/commit/8eda950ad767fee9c201273c21c4720aa41023ef))
* **events, announcements:** owners can edit/delete ([16f45c7](https://github.com/bxrne/ise-alumni/commit/16f45c74f2fe2fa4e8c9f5a7cacd8205b76c5ec0))
* fix tag coloring and placeholder photos to not be random ([3c08e33](https://github.com/bxrne/ise-alumni/commit/3c08e3390f1f0e0610dad9a3c953df59a9662dbc))
* hid emails on email_visible turned off in evs/ancts ([5280900](https://github.com/bxrne/ise-alumni/commit/528090062a31d746060de7440b141cd9cf772014))
* **hooks:** simplified auth state event loop ([5627a9c](https://github.com/bxrne/ise-alumni/commit/5627a9c37f43f747c7f2f55b7766d201243e6716))
* **index:** tidy profile page ([db531b7](https://github.com/bxrne/ise-alumni/commit/db531b709fd61952723651b05202a7c11846781c))
* **Layout:** better mav buttons ([90d86cd](https://github.com/bxrne/ise-alumni/commit/90d86cd4af608c748da6619f16dda9f2491ce40f))
* **Layout:** drawer menu on mobile navbar otherwise ([795aa90](https://github.com/bxrne/ise-alumni/commit/795aa90dc76001ac0e6d7f8fdbeb1b5ac8ae1352))
* **NewEventModal, index.html, supabase:** Adding junction table to types, updated metadata and fixed NewEventModal ([222f8de](https://github.com/bxrne/ise-alumni/commit/222f8de945fb900481106bf1bfe726b02b2733d5))
* **NewEventModal:** fix announcements tag selection ([adc4f1f](https://github.com/bxrne/ise-alumni/commit/adc4f1fb68c2aa6acdeb27ad09da77a46fc5d14e))
* **pages, constants:** Content creation roles enforced ([e2f2298](https://github.com/bxrne/ise-alumni/commit/e2f229827e8cfa8774af31b20ab125141771720a))
* **pages:** linting fixes ([2d153e1](https://github.com/bxrne/ise-alumni/commit/2d153e1ba0069f401288f675941dfc381de07e3f))
* **ProfilePage:** tidied profile page ([deac9de](https://github.com/bxrne/ise-alumni/commit/deac9deb9feda29770504a2878b00950f14b0e7b))
* tests and linting repairs ([ca4085a](https://github.com/bxrne/ise-alumni/commit/ca4085a11e3f0db32f5b1d38d762f55786e3a180))
* **tests, profiles:** Choose program ([ac8dbbd](https://github.com/bxrne/ise-alumni/commit/ac8dbbd17d43db0be6a7141795568e48e80b1c9b))
* **useAuth, index:** make use auth more concrete to state changes, tidy up profile state representation and update ([97eae64](https://github.com/bxrne/ise-alumni/commit/97eae6425a963b239ddc7ba4b83fb0742199b614))
* **utils:** Fix profile filtering to include important fields ([f46d814](https://github.com/bxrne/ise-alumni/commit/f46d8140598e3291f7e4eb751e89ca408f1066b6))

### Code Refactoring

* **lib pages:** Encapsulate data access/manip to domain services for DRY ([33a7c8f](https://github.com/bxrne/ise-alumni/commit/33a7c8f5f314c9f0c8d04b6aefdb7bf940392893))
* **ui:** refactored lib and components for fast refresh ([2526777](https://github.com/bxrne/ise-alumni/commit/25267770934ad81e6d785fa19405e99fc3c9c0ab))

### Documentation

* **README.md:** remove bloat ([93a5622](https://github.com/bxrne/ise-alumni/commit/93a56220e5ffdade22d6d0aa8678da7a143e9583))
* **README.md:** Update pnpm commands ([5e008cc](https://github.com/bxrne/ise-alumni/commit/5e008ccd8a6ace68925f239e4fa8df937bc9b559))

### Styles

* **EventDetail:** moved back button onto its own row ([4087110](https://github.com/bxrne/ise-alumni/commit/4087110bd98d3fe52e9d3a702ad4970bcc5fb017))

### Miscellaneous Chores

* **.github, .releaserc.json:** Add SemVer release automation ([2070735](https://github.com/bxrne/ise-alumni/commit/20707354327918d43b5bceaa58ec0146604caf36))
* Add tests and react scan and logging (pino) ([fe23c5a](https://github.com/bxrne/ise-alumni/commit/fe23c5a470b505bb04fb36727a207da698546e7a))
* **Announcements:** remove description on main page ([dfb972f](https://github.com/bxrne/ise-alumni/commit/dfb972f166196a9fa2561a3e35202cb27886c11b))
* **bun.lockb:** remove runaway lock file ([09b3f3c](https://github.com/bxrne/ise-alumni/commit/09b3f3c78f1fa53f4e5bd46febd941e8ae921913))
* **README.md, package.json:** Rename project module and update README ([8df983c](https://github.com/bxrne/ise-alumni/commit/8df983cf66c92e0ea9ef377739fc45c45f9cbd46))
* **README.md:** Add feature flag docs ([cdf1ab3](https://github.com/bxrne/ise-alumni/commit/cdf1ab3ab01cd29867fdc9e1956f183cdd2d93d7))
