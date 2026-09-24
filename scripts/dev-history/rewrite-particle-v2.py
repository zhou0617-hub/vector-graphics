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
  tx: number;   // 目标位置（原图上的原始位置）
  ty: number;
  rx: number;   // regather 起始位置
  ry: number;
  ox: number;   // scattered 基础位置
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
const REGATHER_DURATION = 3200;   // 重组放慢
const MOUSE_RADIUS = 120;
const MOUSE_FORCE = 3.5;
const LINE_MAX_DIST = 42;          // 粒子间连线最大距离
const GRID_SIZE = 42;              // 空间分割网格尺寸

export function ParticleProgress({ imageUrl, progress, onRegatherComplete }: ParticleProgressProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const onCompleteRef = useRef(onRegatherComplete);
  onCompleteRef.current = onRegatherComplete;

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
      const MAX = 420;
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

      const step = 5;
      const list: Particle[] = [];
      for (let y = 0; y < imgH; y += step) {
        for (let x = 0; x < imgW; x += step) {
          const i = (y * imgW + x) * 4;
          if (data[i + 3] > 128) {
            const tx = offsetX + x;
            const ty = offsetY + y;
            list.push({
              tx, ty,
              rx: tx, ry: ty,
              ox: tx, oy: ty,
              x: tx, y: ty,
              vx: 0, vy: 0,
              pushX: 0, pushY: 0,
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
        const speed = 0.5 + Math.random() * 1.2;
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

    // ---------- 粒子连线（空间网格优化） ----------
    const drawLines = () => {
      const grid = new Map<string, Particle[]>();
      for (const p of particles) {
        const gx = Math.floor(p.x / GRID_SIZE);
        const gy = Math.floor(p.y / GRID_SIZE);
        const key = `${gx},${gy}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(p);
      }

      const mouseActive = mouseX > 0 && mouseY > 0;
      const maxDistSq = LINE_MAX_DIST * LINE_MAX_DIST;

      for (const [key, cell] of grid) {
        const [gx, gy] = key.split(',').map(Number);
        // 检查当前格 + 右、下、右下、左下 4 个方向
        const neighbors: Particle[][] = [];
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1]]) {
          const nKey = `${gx + dx},${gy + dy}`;
          const nCell = grid.get(nKey);
          if (nCell) neighbors.push(nCell);
        }

        for (const a of cell) {
          for (const nCell of neighbors) {
            for (const b of nCell) {
              if (a === b) continue;
              const ddx = a.x - b.x;
              const ddy = a.y - b.y;
              const distSq = ddx * ddx + ddy * ddy;
              if (distSq > maxDistSq) continue;

              const dist = Math.sqrt(distSq);
              let alpha = (1 - dist / LINE_MAX_DIST) * 0.35;

              // 鼠标附近连线变金色
              let color = '160,200,255';  // 淡蓝
              if (mouseActive) {
                const mx = (a.x + b.x) / 2 - mouseX;
                const my = (a.y + b.y) / 2 - mouseY;
                const mDist = Math.sqrt(mx * mx + my * my);
                if (mDist < MOUSE_RADIUS) {
                  const t = 1 - mDist / MOUSE_RADIUS;
                  alpha = Math.min(1, alpha + t * 0.6);
                  color = `249,207,${Math.floor(50 + t * 180)}`;  // 金色
                }
              }

              ctx.strokeStyle = `rgba(${color},${alpha})`;
              ctx.lineWidth = 0.6;
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
          const ease = t * t * t;  // easeInCubic，更缓
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
          // 基础飘散
          for (const p of particles) {
            p.ox += p.vx * 0.4;
            p.oy += p.vy * 0.4;
            if (p.ox < 2) { p.ox = 2; p.vx = Math.abs(p.vx); }
            if (p.ox > W - 2) { p.ox = W - 2; p.vx = -Math.abs(p.vx); }
            if (p.oy < 2) { p.oy = 2; p.vy = Math.abs(p.vy); }
            if (p.oy > H - 2) { p.oy = H - 2; p.vy = -Math.abs(p.vy); }
          }

          // 鼠标推动
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

          // 进入重组
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
          const ease = 1 - Math.pow(1 - t, 3);  // easeOutCubic，前快后慢
          for (const p of particles) {
            p.x = p.rx + (p.tx - p.rx) * ease;
            p.y = p.ry + (p.ty - p.ry) * ease;
          }
          break;
        }
      }

      // 先画线
      drawLines();

      // 再画粒子（在线之上）
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = stage === 'appear' ? 1 : 0.95;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
      }
      ctx.globalAlpha = 1;

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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />;
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
