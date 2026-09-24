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
  isAnchor: boolean;   // 是否参与连线
}

type Stage = 'appear' | 'scatter' | 'scattered' | 'regather';

const APPEAR_DURATION = 800;
const SCATTER_DURATION = 1800;
const REGATHER_DURATION = 3200;
const MOUSE_RADIUS = 100;
const MOUSE_FORCE = 2.5;
const LINE_MAX_DIST = 90;     // 锚点距离可以大一些，因为锚点少

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
              isAnchor: false,
            });
          }
        }
      }

      // 挑选锚点：约 12% 的粒子参与连线
      for (let i = 0; i < list.length; i++) {
        if (Math.random() < 0.12) {
          list[i].isAnchor = true;
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

    // 锚点连线：线条 + 交汇点加强
    const drawAnchorLines = () => {
      const anchors: Particle[] = [];
      for (const p of particles) {
        if (p.isAnchor) anchors.push(p);
      }

      const maxDistSq = LINE_MAX_DIST * LINE_MAX_DIST;
      const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

      // 先收集所有线段
      for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        for (let j = i + 1; j < anchors.length; j++) {
          const b = anchors[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > maxDistSq || d2 < 1) continue;

          const dist = Math.sqrt(d2);
          const alpha = (1 - dist / LINE_MAX_DIST) * 0.4;
          if (alpha < 0.05) continue;

          ctx.strokeStyle = 'rgba(140,180,220,' + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
      }

      // 线条交汇点：在密集处加亮点（镭射感）
      // 用锚点自身位置作为交汇点近似
      for (const a of anchors) {
        let neighborCount = 0;
        for (const other of anchors) {
          if (a === other) continue;
          const dx = a.x - other.x;
          const dy = a.y - other.y;
          if (dx * dx + dy * dy < 3600) neighborCount++; // 60px 内
        }
        if (neighborCount >= 3) {
          // 交汇节点：小而亮
          const intensity = Math.min(1, neighborCount / 8);
          ctx.fillStyle = 'rgba(200,230,255,' + (0.5 + intensity * 0.5) + ')';
          ctx.beginPath();
          ctx.arc(a.x, a.y, 1.5 + intensity, 0, Math.PI * 2);
          ctx.fill();
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

      // 画所有粒子（先画粒子）
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x | 0, p.y | 0, 2, 2);
      }

      // 只在 scattered 和 regather 阶段画锚点连线
      if (stage === 'scattered' || stage === 'regather') {
        drawAnchorLines();
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
"""

path.write_text(code, encoding="utf-8")
print(f"  [重写] {path.relative_to(Path(__file__).parent)}")
