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

const APPEAR_DURATION = 500;
const SCATTER_DURATION = 1200;
const REGATHER_DURATION = 1500;
const MOUSE_RADIUS = 100;
const MOUSE_FORCE = 3.5;

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
    let completed = false;
    let cancelled = false;
    let mouseX = -9999;
    let mouseY = -9999;
    let prevMouseX = -9999;
    let prevMouseY = -9999;

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
        const speed = 0.6 + Math.random() * 1.6;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = newX;
      mouseY = newY;
    };
    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      prevMouseX = -9999;
      prevMouseY = -9999;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

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
          const ease = t * t;
          for (const p of particles) {
            p.x = p.tx + p.vx * ease * 80;
            p.y = p.ty + p.vy * ease * 80;
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
            const mouseVX = prevMouseX > 0 ? mouseX - prevMouseX : 0;
            const mouseVY = prevMouseY > 0 ? mouseY - prevMouseY : 0;
            const mouseSpeed = Math.sqrt(mouseVX * mouseVX + mouseVY * mouseVY);
            const boost = 1 + Math.min(mouseSpeed * 0.1, 2);

            for (const p of particles) {
              const dx = p.ox + p.pushX - mouseX;
              const dy = p.oy + p.pushY - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < MOUSE_RADIUS && dist > 0.5) {
                const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE * boost;
                p.pushX += (dx / dist) * force;
                p.pushY += (dy / dist) * force;
              }
            }
          }

          // 推动偏移回归
          for (const p of particles) {
            p.pushX *= 0.92;
            p.pushY *= 0.92;
            p.x = p.ox + p.pushX;
            p.y = p.oy + p.pushY;
            clampToCanvas(p, W, H);
          }

          if (progressRef.current >= 90) {
            stage = 'regather';
            stageStart = now;
          }
          break;
        }

        case 'regather': {
          for (const p of particles) {
            p.x += (p.tx - p.x) * 0.1;
            p.y += (p.ty - p.y) * 0.1;
          }
          if (elapsed >= REGATHER_DURATION && !completed) {
            completed = true;
            onCompleteRef.current?.();
          }
          break;
        }
      }

      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = stage === 'appear' ? 1 : 0.9;
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
