#!/usr/bin/env node

/**
 * 下载 Real-ESRGAN 模型权重
 *
 * 用法：
 *   node scripts/download-models.js
 *   node scripts/download-models.js anime    # 只下载指定模型
 *
 * 说明：
 *   - 模型文件较大（17-64MB），不入 Git
 *   - 首次在新设备上开发时执行一次即可
 *   - 已存在的文件会跳过
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.resolve(__dirname, '..');
const weightsDir = path.join(root, 'esrgan-service', 'weights');

const MODELS = {
  anime: {
    filename: 'RealESRGAN_x4plus_anime_6B.pth',
    url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth',
    label: '动漫插画模型',
  },
  general: {
    filename: 'RealESRGAN_x4plus.pth',
    url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
    label: '通用图片模型',
  },
  x2: {
    filename: 'RealESRGAN_x2plus.pth',
    url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth',
    label: '2倍放大模型',
  },
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    let redirected = 0;

    function request(u) {
      https.get(u, (res) => {
        // 处理重定向（GitHub Release 会跳转到 CDN）
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          redirected++;
          if (redirected > 5) {
            reject(new Error('重定向次数过多'));
            return;
          }
          request(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const total = parseInt(res.headers['content-length'], 10) || 0;
        const file = fs.createWriteStream(dest);
        let downloaded = 0;
        let lastPrint = 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          const now = Date.now();
          if (now - lastPrint > 300) {
            lastPrint = now;
            const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
            const filled = total ? Math.floor(downloaded / total * 30) : 0;
            const bar = '█'.repeat(filled) + '░'.repeat(30 - filled);
            process.stdout.write(
              `\r  [${bar}] ${pct}%  ${formatSize(downloaded)}${total ? ' / ' + formatSize(total) : ''}`
            );
          }
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close();
          process.stdout.write('\n');
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }

    request(url);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(MODELS);

  // 校验参数
  for (const key of targets) {
    if (!MODELS[key]) {
      console.error(`未知模型: ${key}`);
      console.error(`可用: ${Object.keys(MODELS).join(', ')}`);
      process.exit(1);
    }
  }

  console.log('检查模型权重...\n');

  if (!fs.existsSync(weightsDir)) {
    fs.mkdirSync(weightsDir, { recursive: true });
    console.log(`创建目录: ${weightsDir}\n`);
  }

  let downloaded = 0;
  let skipped = 0;

  for (const key of targets) {
    const model = MODELS[key];
    const dest = path.join(weightsDir, model.filename);

    if (fs.existsSync(dest)) {
      const stat = fs.statSync(dest);
      if (stat.size > 1024) {
        console.log(`✓ ${model.filename} 已存在 (${formatSize(stat.size)}) - ${model.label}`);
        skipped++;
        continue;
      }
      // 文件太小，可能下载中断，删除重下
      fs.unlinkSync(dest);
    }

    console.log(`↓ ${model.label}: ${model.filename}`);
    try {
      await download(model.url, dest);
      const stat = fs.statSync(dest);
      console.log(`✓ 完成 (${formatSize(stat.size)})\n`);
      downloaded++;
    } catch (err) {
      console.error(`✗ 下载失败: ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log('');
  console.log(`完成：下载 ${downloaded} 个，跳过 ${skipped} 个`);
  console.log(`模型目录: ${weightsDir}`);
}

main();