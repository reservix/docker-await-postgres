import { Client } from 'pg';
import { startPostgresContainer } from '.';

jest.setTimeout(1000 * 60 * 5); // 5 Min timeout, so the image cann be pulled.

test('wait until postgres is ready', async () => {
  const config = {
    user: 'admin',
    password: '12345',
    database: 'database',
    image: 'postgres',
  };
  const { stop, port } = await startPostgresContainer(config);

  const client = new Client({
    host: 'localhost',
    port,
    ...config,
  });
  await client.connect();
  const { rows } = await client.query('SELECT NOW()');
  await client.end();

  expect(rows[0].now).toEqual(expect.any(Date));

  await stop();
});
