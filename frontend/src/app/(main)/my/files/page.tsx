'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { getMyFiles, deleteFile, batchDeleteFiles } from '@/lib/api/files';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { FileItem } from '@/types/api';
import {
  Download, FolderOpen, Trash2, Check, X,
  ZoomIn, ZoomOut, CheckSquare, Square, ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function MyFilesPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardWidth, setCardWidth] = useState(260);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerDownload, setViewerDownload] = useState<string | undefined>();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = () => {
    setLoading(true);
    getMyFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    load();
  }, [token, router]);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize));
  const pagedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return files.slice(start, start + pageSize);
  }, [files, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handleDeleteOne = async (id: number, name: string) => {
    if (!confirm(`确认删除「${name}」？此操作不可恢复。`)) return;
    try {
      await deleteFile(id);
      setFiles((list) => list.filter((f) => f.id !== id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确认删除选中的 ${selected.size} 个文件？此操作不可恢复。`)) return;
    try {
      await batchDeleteFiles(Array.from(selected));
      setFiles((list) => list.filter((f) => !selected.has(f.id)));
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '批量删除失败');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = pagedFiles.map((f) => f.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((s) => {
      const next = new Set(s);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const openViewer = (f: FileItem) => {
    const url = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
    setViewerSrc(url);
    setViewerDownload(f.svgUrl ? assetUrl(f.svgUrl) : undefined);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">我的文件</h1>
              <p className="text-sm text-[#f2f2f2]/50">
                {loading
                  ? '加载中...'
                  : `共 ${files.length} 个文件 · 第 ${page} / ${totalPages} 页${selected.size > 0 ? ` · 已选 ${selected.size}` : ''}`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <ZoomOut className="w-4 h-4 text-[#f2f2f2]/40" />
                <input
                  type="range"
                  min={180}
                  max={420}
                  step={20}
                  value={cardWidth}
                  onChange={(e) => setCardWidth(Number(e.target.value))}
                  className="w-24 accent-[#f9cf00]"
                />
                <ZoomIn className="w-4 h-4 text-[#f2f2f2]/40" />
              </div>

              {selectMode ? (
                <>
                  <button onClick={toggleSelectAllOnPage} className="btn-secondary">
                    {pagedFiles.every((f) => selected.has(f.id)) ? (
                      <><CheckSquare className="w-4 h-4" /> 取消本页</>
                    ) : (
                      <><Square className="w-4 h-4" /> 选择本页</>
                    )}
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selected.size === 0}
                    className="btn-primary bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-4 h-4" /> 删除 ({selected.size})
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelected(new Set());
                    }}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {files.length > 0 && (
                    <button onClick={() => setSelectMode(true)} className="btn-secondary">
                      <Check className="w-4 h-4" /> 批量管理
                    </button>
                  )}
                  <Link href="/tools/image-to-svg" className="btn-primary">
                    新建转换
                  </Link>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="glass-card p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-[#f2f2f2]/40" />
              </div>
              <p className="text-[#f2f2f2]/60 mb-4">还没有文件</p>
              <Link href="/tools/image-to-svg" className="btn-primary">
                去转换一张
              </Link>
            </div>
          )}

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))` }}
          >
            {pagedFiles.map((f) => {
              const isSelected = selected.has(f.id);
              const imgSrc = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
              return (
                <div
                  key={f.id}
                  className={`glass-card transition-all ${
                    isSelected ? 'ring-2 ring-[#f9cf00]' : ''
                  }`}
                >
                  <div className="relative aspect-square bg-white/5 border-b border-white/5 overflow-hidden group rounded-t-2xl">
                    <img
                      src={imgSrc}
                      alt={f.name}
                      className="w-full h-full object-contain cursor-zoom-in transition-transform group-hover:scale-[1.02]"
                      onClick={() => openViewer(f)}
                    />

                    {!selectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOne(f.id, f.name);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {selectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(f.id);
                        }}
                        className={`absolute top-2 left-2 w-7 h-7 rounded-md flex items-center justify-center border-2 transition-all ${
                          isSelected
                            ? 'bg-[#f9cf00] border-[#f9cf00] text-black'
                            : 'bg-black/40 border-white/40 hover:border-white'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    )}

                    {f.svgUrl && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#f9cf00] text-black text-[10px] font-bold">
                        SVG
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="font-medium truncate mb-1 text-sm" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-xs text-[#f2f2f2]/40 mb-4">
                      {f.format} · {(f.size / 1024).toFixed(1)} KB
                      {f.width && f.height && ` · ${f.width}×${f.height}`}
                    </p>
                    {f.svgUrl && (
                      <button
                        onClick={() => downloadFile(assetUrl(f.svgUrl)!, f.name.replace(/\.[^.]+$/, '') + '.svg')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> 下载 SVG
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {files.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[#f2f2f2]/60">
                <span>每页显示</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#f2f2f2] text-sm outline-none focus:border-[#f9cf00] transition-colors"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n} className="bg-[#15161a]">{n}</option>
                  ))}
                </select>
                <span>条</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {generatePageNumbers(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`e-${i}`} className="px-2 text-[#f2f2f2]/40">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm transition-colors ${
                        p === page
                          ? 'bg-[#f9cf00] text-black font-semibold'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt="预览"
          downloadUrl={viewerDownload}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (current > 4) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}
