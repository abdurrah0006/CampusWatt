// Creates backend/.env and frontend/.env from the examples if they don't exist yet.
import { copyFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

for (const app of ['backend', 'frontend']) {
  const target = `${app}/.env`;
  if (existsSync(target)) {
    console.log(`${target} already exists - left unchanged`);
    continue;
  }
  copyFileSync(`${app}/.env.example`, target);
  if (app === 'backend') {
    // Give the ingest endpoint a real random key instead of the placeholder.
    const key = randomBytes(24).toString('hex');
    writeFileSync(target, readFileSync(target, 'utf8').replace('change-me-to-a-long-random-string', key));
  }
  console.log(`created ${target}`);
}
