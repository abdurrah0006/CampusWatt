import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNTIME_OVERRIDES_FILE } from '../src/config/constants.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const overridesPath = path.join(dataDir, RUNTIME_OVERRIDES_FILE);

await rm(overridesPath, { force: true });
console.log(`Saved runtime changes cleared: ${overridesPath}`);
console.log('Restart the API to go back to the generated data.');
