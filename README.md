# docker-await-postgres

[![buid][ci-badge]][ci] [![buid][coverage-badge]][coverage] [![version][version-badge]][package] [![MIT License][license-badge]][license]

> Start `postgres` docker container and wait until it is truly ready.

This module is heavily inspired by [`ava-fixture-docker-db`](https://github.com/cdaringe/ava-fixture-docker-db).
But unlike the mentioned module, it is

- test runner agnostic
- will wait until _postges_ is "truly" ready to accepts connections.

Especially, the later will help when writing integration tests.

## Why

The official [_postgres_](https://hub.docker.com/_/postgres) container loads and executes SQL scripts to create an initial
table layout when the container is started, followed by a reboot of the _postgres_ server. This is a welcome feature and
a best practice when using docker to host your database. Sadly, it makes it harder to use the image when writing integration
tests for your database.

Usually, tests run fast and don't wait the µ-seconds until the _postgres_ server has rebooted. This causes tests to randomly break and
connection errors, because the _postgres_ server will just kill all connections when it is rebooting.

Using the Docker API (via `dockerode` or similar) will only tell you if the container is ready, but not if services inside the container are ready
(you can read more about this here: [docker-library/postgres/#146](https://github.com/docker-library/postgres/issues/146)).

`docker-await-postgres` will read the server logs and long poll until the _postgres_ server is trulry ready. So that tests only run when
the server is trurly ready to accept connections.
Start `postgres` docker container and wait until it is truly ready.

This module is based on on [`ava-fixture-docker-db`](https://github.com/cdaringe/ava-fixture-docker-db).
However, it is

- (test) runner agnostic
- waits until `postgres` executed all SQL scripts and restarted

## Why

See https://github.com/docker-library/postgres/issues/146

## Usage

```ts
import { Client } from 'pg';
import { startPostgresContainer } from 'docker-await-postgres';

// Start the container
const config = {
  user: 'admin',
  password: '12345',
  database: 'database',
  image: 'postgres',
};
const { stop, port } = await startPostgresContainer(config);

// Connect to the container
const client = new Client({
  host: 'localhost',
  port,
  ...config,
});
await client.connect();
const { rows } = await client.query('SELECT NOW()');
await client.end();

// Stop the container
await stop();
```

<!-- LINKS -->

[ci]: https://travis-ci.org/Reservix/docker-await-postgres
[ci-badge]: https://img.shields.io/travis/Reservix/docker-await-postgres.svg?style=flat-square
[coverage]: https://codecov.io/gh/Reservix/docker-await-postgres
[coverage-badge]: https://img.shields.io/codecov/c/github/Reservix/docker-await-postgres.svg?style=flat-square
[license]: https://github.com/Reservix/docker-await-postgres/blob/master/LICENSE
[license-badge]: https://img.shields.io/npm/l/docker-await-postgres.svg?style=flat-square
[package]: https://www.npmjs.com/package/docker-await-postgres
[version-badge]: https://img.shields.io/npm/v/docker-await-postgres.svg?style=flat-square
