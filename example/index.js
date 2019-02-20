#!/usr/bin/env node

(async () => {
  const { awaitPostgres } = require('../lib');

  const { stop, port } = await awaitPostgres({
    user: 'admin',
    password: '12345',
    database: 'database',
  });

  console.log(`Postgres running on port ${port} ...`);

  await stop();
})();
