from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "components" / "particle-progress.tsx"

code = """'use client';

import { useEffect, useRef } from 'react';

interface ParticleProgressProps {
  imageUrl: string;
  progress: number;
  onRegatherComplete?: () => void;
}

interface Particle {
  tx: number;
  ty: number;
  rx: number;
  ry: number;
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pushX: number;
  pushY: number;
  color: string;
}

type Stage = 'appear' | 'scatter' | 'scattered' | 'regather';

const APPEAR_DURATION = 800;
const SCATTER_DURATION = 1800;
const REGATHER_DURATION = 3200;
const MOUSE_RADIUS = 100;
const MOUSE_FORCE = 2.5;
const LINE_MAX_DIST = 26;      // 缩短连线距离，只连最近邻
const GRID_SIZE = 26;

export function ParticleProgress({ imageUrl, progress, onRegatherComplete }: ParticleProgressProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = Math.floor(rect.height);
    canvas.width = W;
    canvas.height = H;

    let particles: Particle[] = [];
    let stage: Stage = 'appear';
    let stageStart = performance.now();
    let rafId = 0;
    let cancelled = false;
    let mouseX = -9999;
    let mouseY = -9999;

    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const MAX = 380;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const imgW = Math.floor(img.width * ratio);
      const imgH = Math.floor(img.height * ratio);
      const offsetX = Math.floor((W - imgW) / 2);
      const offsetY = Math.floor((H - imgH) / 2);

      const tmp = document.createElement('canvas');
      tmp.width = imgW;
      tmp.height = imgH;
      const tmpCtx = tmp.getContext('2d')!;
      tmpCtx.drawImage(img, 0, 0, imgW, imgH);
      const data = tmpCtx.getImageData(0, 0, imgW, imgH).data;

      // step=9，粒子数约 700，性能好
      const step = 9;
      const list: Particle[] = [];
      for (let y = 0; y < imgH; y += step) {
        for (let x = 0; x < imgW; x += step) {
          const i = (y * imgW + x) * 4;
          if (data[i + 3] > 128) {
            const tx = offsetX + x;
            const ty = offsetY + y;
            list.push({
              tx, ty, rx: tx, ry: ty, ox: tx, oy: ty,
              x: tx, y: ty, vx: 0, vy: 0, pushX: 0, pushY: 0,
              color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
            });
          }
        }
      }
      particles = list;
    };
    img.src = imageUrl;

    const randomizeVelocity = () => {
      for (const p of particles) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    };
    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // 每 2 帧画一次连线（降低 CPU 负载）
    let frameCount = 0;

    const drawLines = () => {
      const maxDistSq = LINE_MAX_DIST * LINE_MAX_DIST;

      // 网格分桶
      const grid = new Map<string, Particle[]>();
      for (const p of particles) {
        const gx = (p.x / GRID_SIZE) | 0;
        const gy = (p.y / GRID_SIZE) | 0;
        const key = gx + ',' + gy;
        let cell = grid.get(key);
        if (!cell) { cell = []; grid.set(key, cell); }
        cell.push(p);
      }

      for (const [key, cell] of grid) {
        const comma = key.indexOf(',');
        const gx = +key.slice(0, comma);
        const gy = +key.slice(comma + 1);

        // 只检查 3 个邻居方向，避免重复
        const neighborKeys = [
          gx + ',' + gy,           // 当前格
          (gx + 1) + ',' + gy,     // 右
          gx + ',' + (gy + 1),     // 下
          (gx + 1) + ',' + (gy + 1), // 右下
        ];

        for (let k = 0; k < neighborKeys.length; k++) {
          const nCell = grid.get(neighborKeys[k]);
          if (!nCell) continue;

          for (let i = 0; i < cell.length; i++) {
            const a = cell[i];
            for (let j = 0; j < nCell.length; j++) {
              const b = nCell[j];
              if (a === b) continue;
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > maxDistSq || d2 < 0.01) continue;

              const dist = Math.sqrt(d2);
              const alpha = (1 - dist / LINE_MAX_DIST) * 0.18;
              ctx.strokeStyle = 'rgba(120,160,200,' + alpha + ')';
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const render = (now: number) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);

      if (particles.length === 0) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const elapsed = now - stageStart;

      switch (stage) {
        case 'appear':
          if (elapsed >= APPEAR_DURATION) {
            randomizeVelocity();
            stage = 'scatter';
            stageStart = now;
          }
          break;

        case 'scatter': {
          const t = Math.min(1, elapsed / SCATTER_DURATION);
          const ease = t * t * t;
          for (const p of particles) {
            p.x = p.tx + p.vx * ease * 120;
            p.y = p.ty + p.vy * ease * 120;
            clampToCanvas(p, W, H);
            p.ox = p.x;
            p.oy = p.y;
          }
          if (elapsed >= SCATTER_DURATION) {
            stage = 'scattered';
            stageStart = now;
          }
          break;
        }

        case 'scattered': {
          for (const p of particles) {
            p.ox += p.vx * 0.4;
            p.oy += p.vy * 0.4;
            if (p.ox < 2) { p.ox = 2; p.vx = Math.abs(p.vx); }
            if (p.ox > W - 2) { p.ox = W - 2; p.vx = -Math.abs(p.vx); }
            if (p.oy < 2) { p.oy = 2; p.vy = Math.abs(p.vy); }
            if (p.oy > H - 2) { p.oy = H - 2; p.vy = -Math.abs(p.vy); }
          }

          if (mouseX > 0 && mouseY > 0) {
            for (const p of particles) {
              const dx = p.ox + p.pushX - mouseX;
              const dy = p.oy + p.pushY - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < MOUSE_RADIUS && dist > 0.5) {
                const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
                p.pushX += (dx / dist) * force;
                p.pushY += (dy / dist) * force;
              }
            }
          }

          for (const p of particles) {
            p.pushX *= 0.92;
            p.pushY *= 0.92;
            p.x = p.ox + p.pushX;
            p.y = p.oy + p.pushY;
            clampToCanvas(p, W, H);
          }

          if (progressRef.current >= 90) {
            for (const p of particles) {
              p.rx = p.x;
              p.ry = p.y;
            }
            stage = 'regather';
            stageStart = now;
          }
          break;
        }

        case 'regather': {
          const t = Math.min(1, elapsed / REGATHER_DURATION);
          const ease = 1 - Math.pow(1 - t, 3);
          for (const p of particles) {
            p.x = p.rx + (p.tx - p.rx) * ease;
            p.y = p.ry + (p.ty - p.ry) * ease;
          }
          break;
        }
      }

      // 每 2 帧画一次连线
      frameCount++;
      if (frameCount % 2 === 0) {
        drawLines();
      }

      // 粒子
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x | 0, p.y | 0, 2, 2);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [imageUrl]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

function clampToCanvas(p: Particle, W: number, H: number) {
  if (p.x < 2) p.x = 2;
  if (p.x > W - 2) p.x = W - 2;
  if (p.y < 2) p.y = 2;
  if (p.y > H - 2) p.y = H - 2;
}
"""

path.write_text(code, encoding="utf-8")
print(f"  [重写] {path.relative_to(Path(__file__).parent)}")
