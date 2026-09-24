'use client';

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

interface Ripple {
  x: number;
  y: number;
  startTime: number;
}

type Stage = 'appear' | 'scatter' | 'scattered' | 'regather';

const APPEAR_DURATION = 800;
const SCATTER_DURATION = 1800;
const REGATHER_DURATION = 3200;

// 鼠标排斥（加强）
const MOUSE_RADIUS = 150;
const MOUSE_FORCE = 7.0;

// 涟漪（加强，无光圈）
const RIPPLE_DURATION = 1200;
const RIPPLE_MAX_RADIUS = 420;
const RIPPLE_BAND = 70;
const RIPPLE_FORCE = 38;

// 粒子互相排斥
const PARTICLE_INTERACT_RADIUS = 16;
const PARTICLE_INTERACT_FORCE = 0.9;

// 空间网格
const CELL_SIZE = 20;

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
    let ripples: Ripple[] = [];
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

      const step = 5;
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
    const handleClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        startTime: performance.now(),
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    // 空间哈希网格（复用 Map，避免每帧创建）
    const grid: Map<number, number[]> = new Map();
    const cellKey = (cx: number, cy: number) => cy * 100000 + cx;

    const buildGrid = () => {
      grid.clear();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const cx = Math.floor(p.x / CELL_SIZE);
        const cy = Math.floor(p.y / CELL_SIZE);
        const key = cellKey(cx, cy);
        let bucket = grid.get(key);
        if (!bucket) {
          bucket = [];
          grid.set(key, bucket);
        }
        bucket.push(i);
      }
    };

    // 粒子互相排斥
    const applyParticleInteractions = () => {
      const R = PARTICLE_INTERACT_RADIUS;
      const R2 = R * R;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const cx = Math.floor(a.x / CELL_SIZE);
        const cy = Math.floor(a.y / CELL_SIZE);

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const bucket = grid.get(cellKey(cx + dx, cy + dy));
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue;
              const b = particles[j];
              const ddx = a.x - b.x;
              const ddy = a.y - b.y;
              const d2 = ddx * ddx + ddy * ddy;
              if (d2 >= R2 || d2 < 0.01) continue;
              const dist = Math.sqrt(d2);
              const force = (1 - dist / R) * PARTICLE_INTERACT_FORCE;
              const nx = ddx / dist;
              const ny = ddy / dist;
              a.pushX += nx * force;
              a.pushY += ny * force;
              b.pushX -= nx * force;
              b.pushY -= ny * force;
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

          // 鼠标排斥（平方衰减，更有冲击感）
          if (mouseX > 0 && mouseY > 0) {
            for (const p of particles) {
              const dx = p.ox + p.pushX - mouseX;
              const dy = p.oy + p.pushY - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < MOUSE_RADIUS && dist > 0.5) {
                const falloff = 1 - dist / MOUSE_RADIUS;
                const force = falloff * falloff * MOUSE_FORCE;
                p.pushX += (dx / dist) * force;
                p.pushY += (dy / dist) * force;
              }
            }
          }

          // 涟漪
          ripples = ripples.filter((r) => (now - r.startTime) / RIPPLE_DURATION < 1);
          for (const r of ripples) {
            const t = (now - r.startTime) / RIPPLE_DURATION;
            const waveRadius = t * RIPPLE_MAX_RADIUS;
            const decay = 1 - t;

            for (const p of particles) {
              const dx = p.ox + p.pushX - r.x;
              const dy = p.oy + p.pushY - r.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 0.5) continue;
              const bandDist = Math.abs(dist - waveRadius);
              if (bandDist < RIPPLE_BAND) {
                const falloff = 1 - bandDist / RIPPLE_BAND;
                const force = falloff * falloff * RIPPLE_FORCE * decay;
                p.pushX += (dx / dist) * force;
                p.pushY += (dy / dist) * force;
              }
            }
          }

          // 应用阻尼
          for (const p of particles) {
            p.pushX *= 0.9;
            p.pushY *= 0.9;
          }

          // 构建网格 + 粒子互斥
          buildGrid();
          applyParticleInteractions();

          // 位置更新
          for (const p of particles) {
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

      // 绘制粒子
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
      canvas.removeEventListener('click', handleClick);
    };
  }, [imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        willChange: 'contents',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    />
  );
}

function clampToCanvas(p: Particle, W: number, H: number) {
  if (p.x < 2) p.x = 2;
  if (p.x > W - 2) p.x = W - 2;
  if (p.y < 2) p.y = 2;
  if (p.y > H - 2) p.y = H - 2;
}