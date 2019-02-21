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

  await client.connect();
  console.log(`Client connected to Database.`);

  const { rows } = await client.query('SELECT NOW()');
  console.log(`Server time is: ${rows[0].now}`);

  await client.end();
  await stop();
})();
