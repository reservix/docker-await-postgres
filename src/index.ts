import Docker, { Container } from 'dockerode';
import execa from 'execa';
import getPort from 'get-port';
import { ClientConfig, Client } from 'pg';
import retry from 'p-retry';
import { PassThrough } from 'stream';

const docker = new Docker();

/**
 * Ensure that the image is available on the machine.
 * Will pull the image if it doesn't exist yet.
 *
 * @param name image name including version
 */
const ensureImage = async (name: string): Promise<void> => {
  const image = await docker.getImage(name);
  try {
    await image.inspect();
  } catch {
    console.log(`Pulling image "${name}" ...`);
    try {
      // `dockerode`'s pull method doesn't work ... fallback to CLI
      await execa('docker', ['pull', name]);
    } catch (e) {
      throw new Error(`Image "${name}" can not be pulled.\n\n${e.message}`);
    }
  }
};

/**
 * Meh ...
 */
const THE_MAGIC_WORD = 'PostgreSQL init process complete; ready for start up.';

/**
 * Wait until `postgres` was initialized.
 * The docker container will execute SQL script files first.
 * Afterwards the `postgres` server is rebootet.
 *
 * @param container
 */
const isInitialized = async (container: Container): Promise<void> =>
  new Promise((resolve, reject) => {
    const logger = new PassThrough();

    logger.on('data', (chunk: Buffer | string) => {
      const line = chunk.toString('utf8').trim();
      if (line.includes(THE_MAGIC_WORD)) {
        resolve();
      }
    });

    logger.on('error', err => reject(err));
    logger.on('end', () => resolve());

    container.logs(
      {
        follow: true,
        stdout: true,
        stderr: true,
      },
      (err, stream) => {
        if (err) {
          return reject(err);
        }

        if (!stream) {
          return reject(new Error('No stream to read available!'));
        }

        stream.pipe(logger);
      }
    );
  });

/**
 * Ping a `postgres` server (10 times max) until it accepts connections.
 *
 * @param config client configuration to reach the `postgres` server
 */
const isReady = async (config: ClientConfig): Promise<void> =>
  retry(async () => {
    const client = new Client(config);

    await client.connect();
    await client.query('SELECT NOW()');
    await client.end();
  });

/**
 * Kill and remove a docker container.
 *
 * @param container the container to kill
 */
const kill = async (container: Container): Promise<void> => {
  try {
    await container.kill();
  } finally {
    try {
      await container.remove({ force: true });
    } catch (err) {
      // If 404, we probably used the --rm flag on container launch. it's all good.
      if (err.statusCode !== 404 && err.statusCode !== 409) {
        // eslint-disable-next-line no-unsafe-finally
        throw err;
      }
    }
  }
};

/**
 * Configuration for `postgres` container.
 */
export type Config = {
  /**
   * Image name of the container.
   */
  image?: string;

  /**
   * Database user.
   */
  user: string;

  /**
   * Password for the database user.
   */
  password: string;

  /**
   * Database name.
   */
  database: string;
};

export type Result = {
  /**
   * Port on which `postgres` is running.
   */
  port: number;

  /**
   * Stop `postgres` container.
   */
  stop: () => Promise<void>;
};

/**
 * Start a `postgres` container and wait until it is ready
 * to process queries.
 *
 * @param config
 * @returns object with `port` number and a `stop` method
 */
export const startPostgresContainer = async (
  config: Config
): Promise<Result> => {
  const port = await getPort();
  const image = config.image || 'postgres:latest';

  await ensureImage(image);

  const container = await docker.createContainer({
    Image: image,
    ExposedPorts: {
      '5432/tcp': {},
    },
    HostConfig: {
      AutoRemove: true,
      PortBindings: { '5432/tcp': [{ HostPort: String(port) }] },
    },
    Env: [
      `POSTGRES_USER=${config.user}`,
      `POSTGRES_PASSWORD=${config.password}`,
      `POSTGRES_DB=${config.database}`,
    ],
  });

  await container.start();

  await isInitialized(container);
  await isReady({ ...config, host: 'localhost', port });

  return {
    port,
    stop: async () => kill(container),
  };
};
