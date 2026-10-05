#!/usr/bin/env node
// Builds the SPA into dist/frontend/browser for the hermetic Playwright run
// (playwright.hermetic.config.ts serves that folder). Sibling feature routes
// already resolve to placeholder components registered in
// src/app/features/index.ts, so no extra stubs need to be generated here.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const res = spawnSync('npx', ['ng', 'build', '--configuration', 'production'], {
  cwd: webRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
