import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildApp } from '../src/app.js';

process.env['SWAGGER_GENERATE'] = 'true';
process.env['NODE_ENV'] ??= 'development';
process.env['DATABASE_URL'] ??= 'mysql://user:pass@localhost:3306/appdb';
process.env['REDIS_URL'] ??= 'redis://localhost:6379';
process.env['PORT'] ??= '3000';

async function generateOpenApiSpec() {
  const app = await buildApp();
  await app.ready();

  const openapiDocument = app.swagger();

  const docsDir = path.resolve(process.cwd(), '../../docs');
  const outputPath = path.join(docsDir, 'openapi.yaml');

  await fs.mkdir(docsDir, { recursive: true });

  const yamlDocument = stringifyYaml(openapiDocument);

  await fs.writeFile(outputPath, yamlDocument, 'utf8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`✅ OpenAPI specification generated at ${outputPath}`);
}

function stringifyYaml(value: unknown, indent = 0): string {
  const indentation = '  '.repeat(indent);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((item) => {
        const rendered = stringifyYaml(item, indent + 1);
        if (isPrimitive(item)) {
          return `${indentation}- ${rendered.trimStart()}`;
        }
        return `${indentation}-\n${rendered}`;
      })
      .join('\n');
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }

    return entries
      .map(([key, val]) => {
        const rendered = stringifyYaml(val, indent + 1);
        if (isPrimitive(val) || (Array.isArray(val) && val.length === 0)) {
          return `${indentation}${escapeString(key)}: ${rendered}`;
        }

        return `${indentation}${escapeString(key)}:\n${rendered}`;
      })
      .join('\n');
  }

  return formatPrimitive(value as Primitive);
}

type Primitive = string | number | boolean | null | undefined;

function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatPrimitive(value: Primitive): string {
  switch (typeof value) {
    case 'string':
      return escapeString(value);
    case 'number':
    case 'boolean':
      return String(value);
    default:
      return 'null';
  }
}

function escapeString(value: string): string {
  if (value === '') {
    return "''";
  }

  const needsQuoting = /[:\-\?\[\]\{\},&\*#\|<>=!%@`]|^\s|\s$|\n/.test(value);
  if (needsQuoting) {
    return JSON.stringify(value);
  }

  return value;
}

generateOpenApiSpec().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to generate OpenAPI specification', error);
  process.exit(1);
});

