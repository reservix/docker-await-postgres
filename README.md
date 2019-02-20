# docker-await-postgres

Start `postgres` docker container and wait until it is truly ready.

This module is based on on [`ava-fixture-docker-db`](https://github.com/cdaringe/ava-fixture-docker-db).
However, it is

- (test) runner agnostic
- waits until `postgres` executed all SQL scripts and restarted

## Why

See https://github.com/docker-library/postgres/issues/146
