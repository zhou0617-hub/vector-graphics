#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ==================== 目录列表 ====================
const dirs = [
  // --- frontend ---
  'frontend/src/app/(marketing)',
  'frontend/src/app/(auth)/login',
  'frontend/src/app/(auth)/register',
  'frontend/src/app/(main)/tools/image-to-svg',
  'frontend/src/app/(main)/community/post/[id]',
  'frontend/src/app/(main)/my/files',
  'frontend/src/app/(main)/my/favorites',
  'frontend/src/app/(main)/profile/[username]',
  'frontend/src/app/(main)/settings',
  'frontend/src/components/ui',
  'frontend/src/components/layout',
  'frontend/src/components/shared',
  'frontend/src/features/auth',
  'frontend/src/features/converter',
  'frontend/src/features/editor',
  'frontend/src/features/community',
  'frontend/src/features/files',
  'frontend/src/features/profile',
  'frontend/src/lib/api',
  'frontend/src/lib/utils',
  'frontend/src/lib/validators',
  'frontend/src/hooks',
  'frontend/src/stores',
  'frontend/src/types',
  'frontend/src/styles',
  'frontend/public',

  // --- backend ---
  'backend/src/main/java/com/svgplatform/common/response',
  'backend/src/main/java/com/svgplatform/common/exception',
  'backend/src/main/java/com/svgplatform/common/constant',
  'backend/src/main/java/com/svgplatform/common/util',
  'backend/src/main/java/com/svgplatform/common/enums',
  'backend/src/main/java/com/svgplatform/config',
  'backend/src/main/java/com/svgplatform/security',
  'backend/src/main/java/com/svgplatform/infrastructure/storage',
  'backend/src/main/java/com/svgplatform/infrastructure/vectorizer',
  'backend/src/main/java/com/svgplatform/infrastructure/queue',
  'backend/src/main/java/com/svgplatform/modules/user/controller',
  'backend/src/main/java/com/svgplatform/modules/user/service',
  'backend/src/main/java/com/svgplatform/modules/user/repository',
  'backend/src/main/java/com/svgplatform/modules/user/entity',
  'backend/src/main/java/com/svgplatform/modules/user/dto',
  'backend/src/main/java/com/svgplatform/modules/user/mapper',
  'backend/src/main/java/com/svgplatform/modules/user/converter',
  'backend/src/main/java/com/svgplatform/modules/auth/controller',
  'backend/src/main/java/com/svgplatform/modules/auth/service',
  'backend/src/main/java/com/svgplatform/modules/auth/dto',
  'backend/src/main/java/com/svgplatform/modules/file/controller',
  'backend/src/main/java/com/svgplatform/modules/file/service',
  'backend/src/main/java/com/svgplatform/modules/file/repository',
  'backend/src/main/java/com/svgplatform/modules/file/entity',
  'backend/src/main/java/com/svgplatform/modules/file/dto',
  'backend/src/main/java/com/svgplatform/modules/file/converter',
  'backend/src/main/java/com/svgplatform/modules/conversion/controller',
  'backend/src/main/java/com/svgplatform/modules/conversion/service',
  'backend/src/main/java/com/svgplatform/modules/conversion/repository',
  'backend/src/main/java/com/svgplatform/modules/conversion/entity',
  'backend/src/main/java/com/svgplatform/modules/conversion/dto',
  'backend/src/main/java/com/svgplatform/modules/conversion/converter',
  'backend/src/main/java/com/svgplatform/modules/conversion/worker',
  'backend/src/main/java/com/svgplatform/modules/community/post/controller',
  'backend/src/main/java/com/svgplatform/modules/community/post/service',
  'backend/src/main/java/com/svgplatform/modules/community/post/repository',
  'backend/src/main/java/com/svgplatform/modules/community/post/entity',
  'backend/src/main/java/com/svgplatform/modules/community/post/dto',
  'backend/src/main/java/com/svgplatform/modules/community/post/converter',
  'backend/src/main/java/com/svgplatform/modules/community/comment/controller',
  'backend/src/main/java/com/svgplatform/modules/community/comment/service',
  'backend/src/main/java/com/svgplatform/modules/community/comment/repository',
  'backend/src/main/java/com/svgplatform/modules/community/comment/entity',
  'backend/src/main/java/com/svgplatform/modules/community/comment/dto',
  'backend/src/main/java/com/svgplatform/modules/community/like/controller',
  'backend/src/main/java/com/svgplatform/modules/community/like/service',
  'backend/src/main/java/com/svgplatform/modules/community/like/repository',
  'backend/src/main/java/com/svgplatform/modules/community/like/entity',
  'backend/src/main/java/com/svgplatform/modules/community/favorite/controller',
  'backend/src/main/java/com/svgplatform/modules/community/favorite/service',
  'backend/src/main/java/com/svgplatform/modules/community/favorite/repository',
  'backend/src/main/java/com/svgplatform/modules/community/favorite/entity',
  'backend/src/main/java/com/svgplatform/modules/community/tag/controller',
  'backend/src/main/java/com/svgplatform/modules/community/tag/service',
  'backend/src/main/java/com/svgplatform/modules/community/tag/repository',
  'backend/src/main/java/com/svgplatform/modules/community/tag/entity',
  'backend/src/main/java/com/svgplatform/modules/admin/controller',
  'backend/src/main/java/com/svgplatform/modules/admin/service',
  'backend/src/main/java/com/svgplatform/modules/notification/controller',
  'backend/src/main/java/com/svgplatform/modules/notification/service',
  'backend/src/main/java/com/svgplatform/modules/notification/entity',
  'backend/src/main/resources/db/migration',
  'backend/src/main/resources/mapper',
  'backend/src/test/java/com/svgplatform/modules',
  'backend/src/test/java/com/svgplatform/integration',
  'backend/src/test/java/com/svgplatform/support',

  // --- vectorizer ---
  'vectorizer/app/api',
  'vectorizer/app/core',
  'vectorizer/app/services/engines',
  'vectorizer/app/utils',
  'vectorizer/tests',

  // --- docs ---
  'docs/api',
  'docs/database',

  // --- scripts ---
  'scripts',
];

// ==================== 文件列表 ====================
const files = {

  'package.json': `{
  "name": "vector-graphics",
  "version": "0.1.0",
  "private": true,
  "description": "Image to SVG conversion platform with community",
  "scripts": {
    "dev": "node scripts/start-dev.js",
    "init:db": "node scripts/init-db.js",
    "build": "node scripts/build.js",
    "frontend": "npm --prefix frontend run dev",
    "backend": "cd backend && ./mvnw spring-boot:run",
    "vectorizer": "cd vectorizer && python3 -m uvicorn app.main:app --reload --port 8000"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
`,

  '.gitattributes': `* text=auto eol=lf

*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.webp binary
*.ico binary
*.svg text eol=lf

*.sh text eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf

*.java text eol=lf
*.kt text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.md text eol=lf
*.sql text eol=lf
*.xml text eol=lf
*.properties text eol=lf
*.py text eol=lf
`,

  '.gitignore': `# ============ 依赖 ============
node_modules/
.pnp
.pnp.js

# ============ 构建产物 ============
.next/
out/
dist/
build/
target/
*.class

# ============ Python ============
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
env/
.pytest_cache/
.mypy_cache/

# ============ IDE ============
.idea/
.vscode/
*.iml
*.ipr
*.iws
.DS_Store
Thumbs.db
*.swp
*.swo

# ============ 环境变量 ============
.env
.env.local
.env.*.local
!.env.example

# ============ 日志 ============
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ============ 本地数据 ============
data/
uploads/
tmp/
temp/

# ============ 数据库 ============
*.db
*.sqlite
*.sqlite3
`,

  '.editorconfig': `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.java]
indent_size = 4

[*.kt]
indent_size = 4

[*.py]
indent_size = 4

[*.{xml,yml,yaml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`,

  '.nvmrc': `20.11.0
`,

  'docker-compose.yml': `services:
  mysql:
    image: mysql:8.0
    container_name: vg-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: vector_graphics
      MYSQL_USER: vg
      MYSQL_PASSWORD: vg123456
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command:
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-proot"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: vg-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: vg-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: vg
      RABBITMQ_DEFAULT_PASS: vg123456
      RABBITMQ_DEFAULT_VHOST: /
      TZ: Asia/Shanghai
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 15s
      timeout: 10s
      retries: 5

volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
  rabbitmq_data:
    driver: local
`,

  'README.md': `# Vector Graphics Platform

图片转 SVG 工具 + 社区分享平台。

## 项目结构

- \`frontend/\`   Next.js 前端
- \`backend/\`    Spring Boot 后端
- \`vectorizer/\` Python FastAPI 矢量化服务
- \`scripts/\`    跨平台辅助脚本
- \`docs/\`       项目文档

## 环境要求

- Node.js >= 20
- Java 21
- Python 3.10+
- Docker Desktop（用于本地 MySQL / Redis / RabbitMQ）

## 快速开始

\`\`\`bash
npm install
docker compose up -d
npm run dev
\`\`\`

## 各服务端口

| 服务 | 端口 | 说明 |
|---|---|---|
| 前端 Next.js | 3000 | http://localhost:3000 |
| 后端 Spring Boot | 8080 | http://localhost:8080 |
| 矢量化 FastAPI | 8000 | http://localhost:8000 |
| MySQL | 3306 | vg / vg123456 |
| Redis | 6379 | - |
| RabbitMQ | 5672 | 管理: http://localhost:15672 |
`,

  'scripts/start-dev.js': `#!/usr/bin/env node

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
    env: Object.assign({}, process.env, { FORCE_COLOR: '1' }),
  });

  child.on('exit', function (code) {
    console.log('\\n[' + name + '] 进程退出，code = ' + code);
  });

  child.on('error', function (err) {
    console.error('[' + name + '] 启动失败: ' + err.message);
  });

  processes.push({ name: name, child: child });
  return child;
}

function checkDir(p, label) {
  if (!fs.existsSync(p)) {
    console.error('[错误] ' + label + ' 目录不存在: ' + p);
    process.exit(1);
  }
}

checkDir(path.join(root, 'frontend'), 'frontend');
checkDir(path.join(root, 'backend'), 'backend');
checkDir(path.join(root, 'vectorizer'), 'vectorizer');

console.log('正在启动所有服务...\\n');

const pythonCmd = isWindows ? 'python' : 'python3';
run('vectorizer', pythonCmd, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], path.join(root, 'vectorizer'));

const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
run('backend', mvnCmd, ['spring-boot:run'], path.join(root, 'backend'));

run('frontend', 'npm', ['run', 'dev'], path.join(root, 'frontend'));

function shutdown(signal) {
  console.log('\\n收到 ' + signal + '，正在关闭所有服务...');
  processes.forEach(function (item) {
    console.log('关闭 ' + item.name);
    item.child.kill(signal);
  });
  process.exit(0);
}

process.on('SIGINT', function () { shutdown('SIGINT'); });
process.on('SIGTERM', function () { shutdown('SIGTERM'); });
`,

  'scripts/init-db.js': `#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

console.log('正在初始化数据库...\\n');

try {
  console.log('[1/3] 启动 Docker 容器...');
  execSync('docker compose up -d', { cwd: root, stdio: 'inherit', shell: isWindows });

  console.log('\\n[2/3] 等待 MySQL 就绪...');
  const wait = isWindows ? 'timeout /t 10 /nobreak > nul' : 'sleep 10';
  execSync(wait, { cwd: root, stdio: 'inherit', shell: true });

  console.log('\\n[3/3] 执行数据库迁移（Flyway）...');
  const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
  execSync(mvnCmd + ' flyway:migrate', { cwd: path.join(root, 'backend'), stdio: 'inherit', shell: isWindows });

  console.log('\\n数据库初始化完成。');
  console.log('MySQL:    localhost:3306  (vg / vg123456)');
  console.log('Redis:    localhost:6379');
  console.log('RabbitMQ: localhost:5672  (管理后台: http://localhost:15672)');
} catch (err) {
  console.error('\\n初始化失败: ' + err.message);
  process.exit(1);
}
`,

  'scripts/build.js': `#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const root = path.resolve(__dirname, '..');

function step(name, command, cwd) {
  console.log('\\n[构建] ' + name);
  try {
    execSync(command, { cwd: cwd, stdio: 'inherit', shell: isWindows });
  } catch (err) {
    console.error('[构建失败] ' + name);
    process.exit(1);
  }
}

const mvnCmd = isWindows ? 'mvnw.cmd' : './mvnw';
step('后端 Spring Boot', mvnCmd + ' clean package -DskipTests', path.join(root, 'backend'));
step('前端 Next.js', 'npm run build', path.join(root, 'frontend'));

console.log('\\n[构建] 矢量化服务（跳过构建，仅提示）');
console.log('  如需部署，请在 vectorizer/ 下执行:');
console.log('  pip install -r requirements.txt');

console.log('\\n全部构建完成。');
`,
};

// ==================== 执行 ====================
let createdDirs = 0;
let createdFiles = 0;
let skippedFiles = 0;

for (const d of dirs) {
  const full = path.join(ROOT, d);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    createdDirs++;
    console.log('  [目录] ' + d);
  }
}

for (const filePath of Object.keys(files)) {
  const full = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (fs.existsSync(full)) {
    skippedFiles++;
    console.log('  [跳过] ' + filePath + ' (已存在)');
    continue;
  }
  fs.writeFileSync(full, files[filePath], 'utf8');
  createdFiles++;
  console.log('  [文件] ' + filePath);
}

console.log('');
console.log('完成：创建 ' + createdDirs + ' 个目录，' + createdFiles + ' 个文件，跳过 ' + skippedFiles + ' 个已存在文件。');
