// MUST be imported before anything that reads process.env at module scope
// (e.g. createStorageProvider()). Loads the repo-root .env so module-level
// singletons see the same configuration the runtime does.
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = [resolve(process.cwd(), '../.env'), resolve(process.cwd(), '../../.env')].find(existsSync);
if (envPath) loadDotenv({ path: envPath });
