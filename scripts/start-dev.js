#!/usr/bin/env node

/**
 * 一键启动所有服务
 * 自动检测启动完成并中文提示
 */

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const os = require('os');
const fs = require('fs');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

// 颜色
const C = {
  vectorizer: '\x1b[36m',  // 青
  esrgan:     '\x1b[35m',  // 品红
  backend:    '\x1b[32m',  // 绿
  frontend:   '\x1b[34m',  // 蓝
  system:     '\x1b[33m',  // 黄
  ok:         '\x1b[92m',  // 亮绿
  warn:       '\x1b[91m',  // 亮红
  reset:      '\x1b[0m',
};

// 每个服务的启动完成标志（检测到就认为启动成功）
const READY_MARKERS = {
  vectorizer: 'Application startup complete',
  esrgan:     'Application startup complete',
  backend:    'Started SvgPlatformApplication',
  frontend:   'Ready in',
};

// 启动状态
const status = {
  vectorizer: false,
  esrgan:     false,
  backend:    false,
  frontend:   false,
};

const SERVICE_NAMES = {
  vectorizer: '图片转 SVG 服务',
  esrgan:     '图片超分服务',
  backend:    '后端 API',
  frontend:   '前端页面',
};

const processes = [];

function log(name, msg) {
  const color = C[name] || C.system;
  const prefix = `${color}[${name}]${C.reset}`;
  const indent = ' '.repeat(12 - name.length);
  console.log(`${prefix}${indent}${msg}`);
}

function printReady(name) {
  const cnName = SERVICE_NAMES[name] || name;
  console.log(`${C.ok}✅ ${cnName} 启动完成${C.reset}`);
}

function printAllReady() {
  console.log('');
  console.log(`${C.ok}╔════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.ok}║                                                        ║${C.reset}`);
  console.log(`${C.ok}║          🎉 全部服务已启动完成，可以开始使用 🎉        ║${C.reset}`);
  console.log(`${C.ok}║                                                        ║${C.reset}`);
  console.log(`${C.ok}╚════════════════════════════════════════════════════════╝${C.reset}`);
  console.log('');
  console.log(`${C.system}访问地址：${C.reset}`);
  console.log(`  🌐 前端主页   ${C.ok}http://localhost:3000${C.reset}`);
  console.log(`  🔧 后端 API   ${C.ok}http://localhost:8080/swagger-ui.html${C.reset}`);
  console.log(`  🎨 图片转 SVG ${C.ok}http://localhost:8000/docs${C.reset}`);
  console.log(`  ✨ 图片超分   ${C.ok}http://localhost:8001/docs${C.reset}`);
  console.log('');
  console.log(`${C.system}按 Ctrl+C 关闭所有服务${C.reset}`);
  console.log('');
}

function checkAllReady() {
  const allReady = Object.values(status).every((v) => v === true);
  if (allReady) {
    printAllReady();
  }
}

function findVenvPython(serviceDir) {
  const subDirs = isWindows ? ['Scripts'] : ['bin'];
  const names = isWindows ? ['python.exe', 'python3.exe'] : ['python', 'python3'];
  for (const base of ['.venv', 'venv']) {
    for (const sub of subDirs) {
      for (const name of names) {
        const p = path.join(serviceDir, base, sub, name);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return isWindows ? 'python' : 'python3';
}

function checkDir(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`[错误] ${label} 目录不存在: ${p}`);
    process.exit(1);
  }
}

function checkDocker() {
  try {
    execSync('docker ps --filter name=vg-mysql --format "{{.Names}}"', {
      stdio: 'pipe',
      shell: isWindows,
    });
  } catch {
    return false;
  }
  return true;
}

function startService({ name, cwd, command, args }) {
  log(name, `启动: ${path.basename(command)} ${args.join(' ')}`);

  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows && (command.endsWith('.cmd') || command === 'npm'),
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const marker = READY_MARKERS[name];

  function handleLine(line) {
    log(name, line);
    // 检测启动完成标志
    if (!status[name] && marker && line.includes(marker)) {
      status[name] = true;
      printReady(name);
      checkAllReady();
    }
  }

  const stdout = readline.createInterface({ input: child.stdout });
  const stderr = readline.createInterface({ input: child.stderr });

  stdout.on('line', handleLine);
  stderr.on('line', handleLine);

  child.on('exit', (code) => {
    log(name, `进程退出，code = ${code}`);
  });

  child.on('error', (err) => {
    log(name, `启动失败: ${err.message}`);
  });

  processes.push({ name, child });
  return child;
}

function shutdown(signal) {
  console.log('');
  log('system', `收到 ${signal}，正在关闭所有服务...`);

  for (const { name, child } of processes) {
    try {
      if (isWindows) {
        execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: 'ignore' });
      } else {
        child.kill('SIGINT');
      }
      log('system', `已关闭 ${name}`);
    } catch {
      // 忽略
    }
  }

  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function main() {
  checkDir(path.join(root, 'vectorizer'), 'vectorizer');
  checkDir(path.join(root, 'esrgan-service'), 'esrgan-service');
  checkDir(path.join(root, 'backend'), 'backend');
  checkDir(path.join(root, 'frontend'), 'frontend');

  if (!checkDocker()) {
    log('system', '⚠️  Docker 中间件未运行，尝试启动...');
    try {
      execSync('docker compose up -d', { cwd: root, stdio: 'inherit', shell: isWindows });
      log('system', '等待 MySQL 就绪（10 秒）...');
      await new Promise((r) => setTimeout(r, 10000));
    } catch (err) {
      log('system', '⚠️  Docker 启动失败，请手动执行: docker compose up -d');
    }
  } else {
    log('system', '✓ Docker 中间件已运行');
  }

  console.log('');
  log('system', '正在启动所有服务，首次启动可能需要 30-60 秒...');
  console.log('');

  startService({
    name: 'vectorizer',
    cwd: path.join(root, 'vectorizer'),
    command: findVenvPython(path.join(root, 'vectorizer')),
    args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
  });

  startService({
    name: 'esrgan',
    cwd: path.join(root, 'esrgan-service'),
    command: findVenvPython(path.join(root, 'esrgan-service')),
    args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8001'],
  });

  startService({
    name: 'backend',
    cwd: path.join(root, 'backend'),
    command: isWindows ? '.\\mvnw.cmd' : './mvnw',
    args: ['spring-boot:run'],
  });

  startService({
    name: 'frontend',
    cwd: path.join(root, 'frontend'),
    command: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});