import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve(process.argv[2] || 'www/assets/runtime-config.js');

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

const config = {
  apiBaseUrl: readEnv('PUBLIC_API_BASE_URL', 'API_BASE_URL'),
  nativeApiBaseUrl: readEnv('PUBLIC_NATIVE_API_BASE_URL', 'NATIVE_API_BASE_URL')
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `window.__TRANSPORT_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
  'utf8'
);

console.log(`Runtime config written to ${outputPath}`);
