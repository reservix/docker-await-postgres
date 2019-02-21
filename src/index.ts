import Docker, { Container } from 'dockerode';
import execa from 'execa';
import getPort from 'get-port';
import { PassThrough } from 'stream';

const docker = new Docker();

const getImage = async (name: string) => {
  const image = await docker.getImage(name);
  try {
    await image.inspect();
  } catch {
    // Docker API will yield a 404 -> image does not exist
    console.log(`Pulling "${name}"...`);
    await execa('docker', ['pull', name]);
  }
};

/**
 * Meh ...
 */
const THE_MAGIC_WORD = 'PostgreSQL init process complete; ready for start up.';

/**
 * Resolved when the `postgres` container is "truly" ready.
 *
 * @param container
 */
const isReady = (container: Container) =>
  new Promise((resolve, reject) => {
    const logger = new PassThrough();

    logger.on('data', (chunk: Buffer | string) => {
      const string = chunk.toString('utf8').trim();
      if (string.includes(THE_MAGIC_WORD)) {
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
          return reject('No stream to read available!');
        }

        container.modem.demuxStream(stream, logger, logger);
      }
    );
  });

/**
 * Kill and remove a docker container.
 *
 * @param container the container to kill
 */
const kill = (container: Container) => async () => {
  try {
    await container.kill();
  } finally {
    try {
      await container.remove({ force: true });
    } catch (err) {
      // if 404, we probably used the --rm flag on container launch. it's all good.
      if (err.statusCode !== 404 && err.statusCode !== 409) throw err;
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

/**
 * Start a `postgres` container and wait until it is ready
 * to process queries.
 *
 * @param config
 * @returns object with `port` number and a `stop` method
 */
export const awaitPostgres = async (config: Config) => {
  const port = await getPort();
  const image = config.image || 'postgres';

  await getImage(image);

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
  await isReady(container);

  return {
    port,
    stop: kill(container),
  };
};
