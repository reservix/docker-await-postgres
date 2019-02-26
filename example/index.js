#!/usr/bin/env node
const { Client } = require('pg');
const { startPostgresContainer } = require('../lib');

(async () => {
  const config = {
    user: 'admin',
    password: '12345',
    database: 'database',
    image: 'postgres',
  };

  const { stop, port } = await startPostgresContainer(config);
  console.log(`Postgres running on port ${port} ...`);

  const client = new Client({
    host: 'localhost',
    port,
    ...config,
  });

  await client.connect();
  console.log(`Client connected to Database.`);

  const { rows } = await client.query('SELECT NOW()');
  console.log(`Server time is: ${rows[0].now}`);

  await client.end();
  await stop();
})();
