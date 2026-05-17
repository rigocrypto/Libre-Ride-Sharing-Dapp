#!/usr/bin/env node
import { spawn } from 'child_process';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const pidFile = path.resolve(process.cwd(), '.dev-server.pid');
const logFile = path.resolve(process.cwd(), 'dev.log');
const errorLogFile = path.resolve(process.cwd(), 'dev-error.log');
const tsxCli = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');

// If PID file exists and process is alive, reuse it
if (fs.existsSync(pidFile)) {
  try {
    const existing = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
    process.kill(existing, 0); // throws if not running
    console.log(`Dev server already running with PID ${existing}`);
    process.exit(0);
  } catch (e) {
    console.log('Stale PID file found or process not running, starting new server');
    try { fs.unlinkSync(pidFile); } catch (_) {}
  }
}

if (process.platform === 'win32') {
  const psCommand = [
    `$env:NODE_ENV='${process.env.NODE_ENV || 'development'}'`,
    `$env:STORAGE_ENGINE='${process.env.STORAGE_ENGINE || 'mem'}'`,
    `$p = Start-Process -WindowStyle Hidden -FilePath '${process.execPath}' -ArgumentList @('${tsxCli}', 'server/index-dev.ts') -WorkingDirectory '${process.cwd()}' -RedirectStandardOutput '${logFile}' -RedirectStandardError '${errorLogFile}' -PassThru`,
    '$p.Id',
  ].join('; ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', psCommand], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }

  const pid = result.stdout.trim().split(/\r?\n/).at(-1);
  fs.writeFileSync(pidFile, String(pid));
  console.log(`Started detached dev server (PID ${pid}). Use 'npm run stop:dev' to stop.`);
  process.exit(0);
}

const logFd = fs.openSync(logFile, 'a');
const child = spawn(process.execPath, [tsxCli, 'server/index-dev.ts'], {
  detached: true,
  stdio: ['ignore', logFd, logFd],
  windowsHide: true,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    STORAGE_ENGINE: process.env.STORAGE_ENGINE || 'mem',
  },
});

child.unref();
fs.writeFileSync(pidFile, String(child.pid));
console.log(`Started detached dev server (PID ${child.pid}). Use 'npm run stop:dev' to stop.`);
process.exit(0);
