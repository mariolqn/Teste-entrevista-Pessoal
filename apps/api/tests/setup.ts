import { beforeAll, afterAll } from 'vitest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import path from 'node:path';

let container: StartedTestContainer | undefined;
let prisma: PrismaClient | undefined;
let databaseUrl: string | undefined;

const projectRoot = path.resolve(__dirname, '..');
const schemaPath = path.resolve(projectRoot, 'prisma', 'schema.prisma');

declare global {
  // eslint-disable-next-line no-var
  var __TEST_PRISMA__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __TEST_MYSQL_CONTAINER__: StartedTestContainer | undefined;
  // eslint-disable-next-line no-var
  var __TEST_DATABASE_URL__: string | undefined;
}

beforeAll(async () => {
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = process.env['LOG_LEVEL'] ?? 'error';
  process.env['LOG_PRETTY'] = process.env['LOG_PRETTY'] ?? 'false';
  process.env['FEATURE_CACHE_ENABLED'] = process.env['FEATURE_CACHE_ENABLED'] ?? 'false';
  process.env['FEATURE_RATE_LIMIT_ENABLED'] =
    process.env['FEATURE_RATE_LIMIT_ENABLED'] ?? 'false';
  process.env['FEATURE_SWAGGER_ENABLED'] =
    process.env['FEATURE_SWAGGER_ENABLED'] ?? 'false';

  if (globalThis.__TEST_MYSQL_CONTAINER__ && globalThis.__TEST_DATABASE_URL__) {
    container = globalThis.__TEST_MYSQL_CONTAINER__;
    databaseUrl = globalThis.__TEST_DATABASE_URL__;
    process.env['DATABASE_URL'] = databaseUrl;
    prisma = globalThis.__TEST_PRISMA__ ?? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  } else {
    container = await new GenericContainer('mysql:8.0')
      .withEnvironment({
        MYSQL_ROOT_PASSWORD: 'dashboard',
        MYSQL_DATABASE: 'dashboard_test',
        MYSQL_USER: 'dashboard',
        MYSQL_PASSWORD: 'dashboard',
      })
      .withExposedPorts(3306)
      .withWaitStrategy(Wait.forLogMessage('ready for connections'))
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(3306);
    databaseUrl = `mysql://dashboard:dashboard@${host}:${port}/dashboard_test`;

    await waitForDatabase(databaseUrl);

    process.env['DATABASE_URL'] = databaseUrl;

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    globalThis.__TEST_PRISMA__ = prisma;
    globalThis.__TEST_MYSQL_CONTAINER__ = container;
    globalThis.__TEST_DATABASE_URL__ = databaseUrl;

    const env = {
      ...process.env,
      DATABASE_URL: databaseUrl,
    };

    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });

    execSync('npx tsx prisma/seed.ts', {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    });
  }

  if (!databaseUrl) {
    throw new Error('Database URL could not be resolved for tests');
  }
});

afterAll(async () => {
  await prisma?.$disconnect();
  if (container) {
    await container.stop();
  }
});

async function waitForDatabase(url: string, retries = 10, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const client = new PrismaClient({
        datasources: {
          db: {
            url,
          },
        },
      });
      await client.$queryRawUnsafe('SELECT 1');
      await client.$disconnect();
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
