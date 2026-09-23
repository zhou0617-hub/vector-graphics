#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

function step(name, command, cwd) {
  console.log('\n[构建] ' + name);
  try {
    execSync(command, { cwd, stdio: 'inherit', shell: isWindows });
  } catch (err) {
    console.error('[构建失败] ' + name);
    process.exit(1);
  }
}

const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
step('后端 Spring Boot', mvnCmd + ' clean package -DskipTests', path.join(root, 'backend'));
step('前端 Next.js', 'npm run build', path.join(root, 'frontend'));

console.log('\n[构建] Python 服务（跳过，仅提示）');
console.log('  vectorizer:      pip install -r requirements.txt');
console.log('  esrgan-service:  pip install -r requirements.txt');

console.log('\n全部构建完成。');