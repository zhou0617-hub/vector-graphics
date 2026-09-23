#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

console.log('正在初始化数据库...\n');

try {
  console.log('[1/3] 启动 Docker 容器...');
  execSync('docker compose up -d', { cwd: root, stdio: 'inherit', shell: isWindows });

  console.log('\n[2/3] 等待 MySQL 就绪...');
  const wait = isWindows ? 'timeout /t 10 /nobreak > nul' : 'sleep 10';
  execSync(wait, { cwd: root, stdio: 'inherit', shell: true });

  console.log('\n[3/3] 执行数据库迁移（Flyway）...');
  const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
  execSync(mvnCmd + ' flyway:migrate', {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit',
    shell: isWindows,
  });

  console.log('\n数据库初始化完成。');
  console.log('MySQL:    localhost:3306  (vg / vg123456)');
  console.log('Redis:    localhost:6379');
  console.log('RabbitMQ: localhost:5672');
} catch (err) {
  console.error('\n初始化失败: ' + err.message);
  process.exit(1);
}