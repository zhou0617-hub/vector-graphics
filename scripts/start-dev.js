#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');
const processes = [];

function run(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd: cwd || root,
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  child.on('exit', (code) => console.log(`\n[${name}] 进程退出，code = ${code}`));
  child.on('error', (err) => console.error(`[${name}] 启动失败: ${err.message}`));
  processes.push({ name, child });
  return child;
}

function checkDir(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`[错误] ${label} 目录不存在: ${p}`);
    process.exit(1);
  }
}

function findVenvPython(baseDir) {
  const subDirs = isWindows ? ['Scripts'] : ['bin'];
  const names = isWindows ? ['python.exe', 'python3.exe'] : ['python', 'python3'];
  for (const base of ['.venv', 'venv']) {
    for (const sub of subDirs) {
      for (const name of names) {
        const p = path.join(baseDir, base, sub, name);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return isWindows ? 'python' : 'python3';
}

checkDir(path.join(root, 'frontend'), 'frontend');
checkDir(path.join(root, 'backend'), 'backend');
checkDir(path.join(root, 'vectorizer'), 'vectorizer');

console.log('正在启动所有服务...\n');

// 1. vectorizer
const vecPy = findVenvPython(path.join(root, 'vectorizer'));
console.log(`[vectorizer] Python: ${vecPy}`);
run('vectorizer', vecPy,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
  path.join(root, 'vectorizer'));

// 2. esrgan-service（可选）
const esrganDir = path.join(root, 'esrgan-service');
if (fs.existsSync(esrganDir)) {
  const esrganPy = findVenvPython(esrganDir);
  console.log(`[esrgan] Python: ${esrganPy}`);
  run('esrgan', esrganPy,
    ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8001'],
    esrganDir);
}

// 3. backend
const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
run('backend', mvnCmd, ['spring-boot:run'], path.join(root, 'backend'));

// 4. frontend
run('frontend', 'npm', ['run', 'dev'], path.join(root, 'frontend'));

function shutdown(signal) {
  console.log(`\n收到 ${signal}，正在关闭所有服务...`);
  processes.forEach(({ name, child }) => {
    console.log(`关闭 ${name}`);
    try { child.kill(signal); } catch (e) {}
  });
  setTimeout(() => process.exit(0), 1500);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
