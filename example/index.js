#!/usr/bin/env node
const { Client } = require('pg');
const execa = require('execa');
const { awaitPostgres } = require('../lib');

(async () => {
  const credentials = {
    user: 'admin',
    password: '12345',
    database: 'database',
  };

  const { stop, port } = await awaitPostgres(credentials);
  console.log(`Postgres running on port ${port} ...`);

  const client = new Client({
    host: 'localhost',
    port,
    ...credentials,
  });

  await execa('docker', ['ps']);

  await client.connect();
  console.log(`Client connected to Database.`);

  const result = await client.query(
    'SELECT * FROM pg_stat_database WHERE datname=$1',
    [credentials.database]
  );
  console.log(result);

  await client.end();
  await stop();
})();
