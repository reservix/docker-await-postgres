# docker-await-postgres

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
