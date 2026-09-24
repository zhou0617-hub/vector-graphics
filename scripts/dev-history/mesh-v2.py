from pathlib import Path

path = Path(__file__).parent / "frontend" / "src" / "components" / "particle-progress.tsx"

code = """'use client';

import { useEffect, useRef } from 'react';
import Delaunator from 'delaunator';

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
  isAnchor: boolean;
}

type Stage = 'appear' | 'scatter' | 'scattered' | 'regather';

const APPEAR_DURATION = 800;
const SCATTER_DURATION = 1800;
const REGATHER_DURATION = 3200;
const MOUSE_RADIUS = 100;
const MOUSE_FORCE = 2.5;
const MESH_UPDATE_INTERVAL = 3;
const HIGHLIGHT_HOPS = 2;       // 从最近锚点延伸几跳高亮

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
    let anchors: Particle[] = [];
    let triangles: Delaunator<Float64Array> | null = null;
    // 邻接表：锚点索引 -> 邻居索引集合
    let adjacency: Map<number, Set<number>> = new Map();
    let stage: Stage = 'appear';
    let stageStart = performance.now();
    let rafId = 0;
    let cancelled = false;
    let frameCount = 0;
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

      const step = 11;
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

      for (let i = 0; i < list.length; i++) {
        if (Math.random() < 0.3) {
          list[i].isAnchor = true;
        }
      }
      particles = list;
      anchors = list.filter((p) => p.isAnchor);
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

    // ---------- 三角网格 + 邻接表 ----------
    const updateTriangles = () => {
      if (anchors.length < 3) return;
      const coords = new Float64Array(anchors.length * 2);
      for (let i = 0; i < anchors.length; i++) {
        coords[i * 2] = anchors[i].x;
        coords[i * 2 + 1] = anchors[i].y;
      }
      try {
        triangles = new Delaunator(coords);
        // 构建邻接表
        adjacency = new Map();
        const tri = triangles.triangles;
        for (let i = 0; i < tri.length; i += 3) {
          const a = tri[i];
          const b = tri[i + 1];
          const c = tri[i + 2];
          addEdge(a, b);
          addEdge(b, c);
          addEdge(c, a);
        }
      } catch {
        triangles = null;
        adjacency = new Map();
      }
    };

    const addEdge = (a: number, b: number) => {
      if (!adjacency.has(a)) adjacency.set(a, new Set());
      if (!adjacency.has(b)) adjacency.set(b, new Set());
      adjacency.get(a)!.add(b);
      adjacency.get(b)!.add(a);
    };

    // 计算从鼠标最近锚点出发，沿网格延伸的跳数
    const computeHopMap = (): Map<number, number> => {
      const hopMap = new Map<number, number>();
      if (!triangles || anchors.length === 0) return hopMap;
      if (mouseX < 0 || mouseY < 0) return hopMap;

      // 找最近锚点
      let nearestIdx = -1;
      let nearestDistSq = Infinity;
      for (let i = 0; i < anchors.length; i++) {
        const dx = anchors[i].x - mouseX;
        const dy = anchors[i].y - mouseY;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestDistSq) {
          nearestDistSq = d2;
          nearestIdx = i;
        }
      }
      if (nearestIdx < 0) return hopMap;

      // BFS
      const queue: number[] = [nearestIdx];
      hopMap.set(nearestIdx, 0);
      while (queue.length > 0) {
        const cur = queue.shift()!;
        const curHop = hopMap.get(cur)!;
        if (curHop >= HIGHLIGHT_HOPS) continue;
        const neighbors = adjacency.get(cur);
        if (!neighbors) continue;
        for (const n of neighbors) {
          if (!hopMap.has(n)) {
            hopMap.set(n, curHop + 1);
            queue.push(n);
          }
        }
      }
      return hopMap;
    };

    const drawTriangleMesh = () => {
      if (!triangles) return;
      const tri = triangles.triangles;
      const coords = triangles.coords;
      const hopMap = computeHopMap();
      const hasHighlight = hopMap.size > 0;

      // 灰色网格：每 3 个三角形跳过 1 个
      ctx.strokeStyle = 'rgba(220,220,220,0.18)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < tri.length; i += 3) {
        const triIdx = i / 3;
        if (triIdx % 3 === 2) continue;

        const a = tri[i];
        const b = tri[i + 1];
        const c = tri[i + 2];

        const ax = coords[a * 2];
        const ay = coords[a * 2 + 1];
        const bx = coords[b * 2];
        const by = coords[b * 2 + 1];
        const cx = coords[c * 2];
        const cy = coords[c * 2 + 1];

        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.closePath();
      }
      ctx.stroke();

      // 金色高亮：跳数内的三角形
      if (hasHighlight) {
        ctx.strokeStyle = 'rgba(249,207,0,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < tri.length; i += 3) {
          const a = tri[i];
          const b = tri[i + 1];
          const c = tri[i + 2];

          const hopA = hopMap.get(a);
          const hopB = hopMap.get(b);
          const hopC = hopMap.get(c);
          // 至少一个顶点在跳数范围内，且不超过范围
          const inRange =
            (hopA !== undefined && hopA <= HIGHLIGHT_HOPS) ||
            (hopB !== undefined && hopB <= HIGHLIGHT_HOPS) ||
            (hopC !== undefined && hopC <= HIGHLIGHT_HOPS);
          if (!inRange) continue;

          const ax = coords[a * 2];
          const ay = coords[a * 2 + 1];
          const bx = coords[b * 2];
          const by = coords[b * 2 + 1];
          const cx = coords[c * 2];
          const cy = coords[c * 2 + 1];

          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.lineTo(cx, cy);
          ctx.closePath();
        }
        ctx.stroke();
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
      frameCount++;

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

      if (stage === 'scattered' || stage === 'regather') {
        if (frameCount % MESH_UPDATE_INTERVAL === 0 || !triangles) {
          updateTriangles();
        }
        drawTriangleMesh();
      }

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
