#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const pidFile = path.resolve(process.cwd(), '.dev-server.pid');
if (!fs.existsSync(pidFile)) {
  console.error('No PID file found. Is the dev server running?');
  process.exit(1);
}
const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
try {
  if (process.platform === 'win32') {
    const { spawnSync } = await import('child_process');
    const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error(`taskkill exited with status ${result.status}`);
    }
  } else {
    process.kill(-pid);
  }
  console.log(`Stopped dev server (PID ${pid})`);
  fs.unlinkSync(pidFile);
  process.exit(0);
} catch (e) {
  console.error('Failed to stop dev server:', e.message || e);
  process.exit(1);
}
