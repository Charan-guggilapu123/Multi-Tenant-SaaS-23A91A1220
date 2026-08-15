const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'node_modules', '.bin');
const shimPath = path.join(binDir, 'react-scripts');

const shim = `#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.join(rootDir, 'frontend');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const installResult = spawnSync(npmCommand, ['ci'], {
  cwd: frontendDir,
  stdio: 'inherit'
});

if (installResult.status !== 0) {
  process.exit(installResult.status || 1);
}

const buildResult = spawnSync(npmCommand, ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit'
});

process.exit(buildResult.status || 1);
`;

fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(shimPath, shim, { mode: 0o755 });
fs.chmodSync(shimPath, 0o755);