'use client';

/**
 * 全屏图片查看器
 *
 * 功能：
 * - 滚轮缩放（0.2x - 8x）
 * - 拖拽平移
 * - 快捷键：Esc 关闭、+/- 缩放、0 重置
 * - 下载：从 URL 自动推导文件名，支持任意图片格式（PNG / JPG / SVG / WebP）
 *
 * 下载文件名规则：
 * - 优先用 props.downloadFilename
 * - 否则从 downloadUrl 里截取最后一段路径作为文件名
 * - 去掉查询参数（?xxx），避免文件名带奇怪后缀
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, X, Download, Maximize2, Loader2 } from 'lucide-react';
import { downloadFile } from '@/lib/utils';

interface Props {
  src: string;
  alt?: string;
  /** 可下载的资源 URL，不传则不显示下载按钮 */
  downloadUrl?: string;
  /** 下载文件名，不传时从 downloadUrl 自动推导 */
  downloadFilename?: string;
  onClose: () => void;
}

/**
 * 从 URL 推导文件名
 * 例：http://host/static/uploads/2026/09/abc_upscaled.png?t=1 -> abc_upscaled.png
 */
function deriveFilename(url: string): string {
  try {
    const path = url.split('?')[0].split('#')[0];
    const lastSlash = path.lastIndexOf('/');
    const name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
    return name || 'download';
  } catch {
    return 'download';
  }
}

export function ImageViewer({ src, alt, downloadUrl, downloadFilename, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /** 重置缩放和位移 */
  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  // 键盘快捷键：Esc 关闭、+/- 缩放、0 重置
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.2, 8));
      if (e.key === '-') setScale((s) => Math.max(s - 0.2, 0.2));
      if (e.key === '0') resetView();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, resetView]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 8));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.2));

  /** 滚轮缩放（阻止页面滚动） */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(Math.max(s + delta, 0.2), 8));
  }, []);

  /** 鼠标按下：开始拖拽 */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  /** 鼠标移动：拖拽平移 */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  /** 鼠标松开：结束拖拽 */
  const handleMouseUp = () => {
    dragging.current = false;
  };

  /** 下载：优先用 props.downloadFilename，否则从 URL 推导 */
  const handleDownload = async () => {
    if (!downloadUrl) return;
    setDownloading(true);
    try {
      const filename = downloadFilename || deriveFilename(downloadUrl);
      await downloadFile(downloadUrl, filename);
    } catch (e) {
      alert(e instanceof Error ? e.message : '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      onWheel={handleWheel}
    >
      {/* 顶部工具栏：缩放百分比 + 关闭按钮 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-sm text-[#f2f2f2]/60">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 图片区域：可拖拽平移 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center select-none"
        style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
            maxWidth: '90vw',
            maxHeight: '80vh',
          }}
        />
      </div>

      {/* 底部工具栏：缩放 + 重置 + 下载 */}
      <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-white/10">
        <button
          onClick={zoomOut}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          title="缩小 (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={zoomIn}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          title="放大 (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          title="重置 (0)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {downloadUrl && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-10 px-4 rounded-full bg-[#f9cf00] text-black font-medium hover:bg-[#ffdb33] flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 下载中</>
            ) : (
              <><Download className="w-4 h-4" /> 下载</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}