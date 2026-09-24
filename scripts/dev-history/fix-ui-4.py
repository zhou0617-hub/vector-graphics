import os
from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [重写] {path.relative_to(ROOT)}")

print("=" * 60)
print("前端 4 项修改")
print("=" * 60)
print()

# ============ 1. image-to-svg 页面（大卡片 + 模式介绍） ============
print("[1/3] image-to-svg 页面")
write(FE / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx", r"""'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { convertImage } from '@/lib/api/conversion';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { ConvertResponse } from '@/types/api';
import { Image as ImageIcon, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';

const MODES = {
  standard: {
    label: '标准',
    short: '快速转换',
    description: '快速矢量化，文件小，适合图标、Logo 等简单图形',
    suitable: '图标、Logo、简单插画',
    output: '文件最小，速度最快',
    params: {
      color_precision: 6,
      layer_difference: 16,
      length_threshold: 4.0,
      filter_speckle: 4,
      max_iterations: 10,
      splice_threshold: 45,
    },
  },
  high: {
    label: '高精度',
    short: '细节优先',
    description: '保留更多颜色和细节，适合有渐变的插画',
    suitable: '插画、有渐变的图片',
    output: '文件中等，细节丰富',
    params: {
      color_precision: 7,
      layer_difference: 10,
      length_threshold: 3.0,
      filter_speckle: 2,
      max_iterations: 20,
      splice_threshold: 35,
    },
  },
  ultra: {
    label: '超高清',
    short: '极致细节',
    description: '最大程度还原细节，文件最大，适合专业场景',
    suitable: '需要印刷、专业设计',
    output: '文件最大，细节最全',
    params: {
      color_precision: 8,
      layer_difference: 4,
      length_threshold: 1.5,
      filter_speckle: 1,
      max_iterations: 30,
      splice_threshold: 20,
    },
  },
} as const;

type ModeKey = keyof typeof MODES;
const MODE_KEYS: ModeKey[] = ['standard', 'high', 'ultra'];

function ModeSelector({ value, onChange }: { value: ModeKey; onChange: (v: ModeKey) => void }) {
  const index = MODE_KEYS.indexOf(value);

  return (
    <div className="relative inline-grid grid-cols-3 rounded-full bg-white/5 border border-white/10 p-1 select-none">
      <div
        className="absolute top-1 bottom-1 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/50 transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: `calc(4px + ${index} * (100% - 8px) / 3)`,
          width: `calc((100% - 8px) / 3)`,
        }}
      />
      {MODE_KEYS.map((key) => {
        const active = key === value;
        const mode = MODES[key];
        return (
          <div key={key} className="relative group/mode">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(key); }}
              className={`relative z-10 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? 'text-[#f9cf00]' : 'text-white/70 hover:text-white'
              }`}
            >
              {mode.label}
            </button>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 rounded-xl bg-[#15161a] border border-white/10 shadow-2xl opacity-0 invisible group-hover/mode:opacity-100 group-hover/mode:visible transition-all duration-200 pointer-events-none z-50">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-9 h-9 rounded-lg bg-[#f9cf00]/15 flex items-center justify-center text-[#f9cf00] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-white">{mode.label}</h4>
                  <p className="text-xs text-white/40">{mode.short}</p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">{mode.description}</p>
              <div className="flex flex-col gap-1.5 text-xs pt-3 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-white/40">适合</span>
                  <span className="text-white/80">{mode.suitable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">输出</span>
                  <span className="text-white/60 text-[10px]">{mode.output}</span>
                </div>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 bg-[#15161a] border-r border-b border-white/10 rotate-45" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ImageToSvgPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [mode, setMode] = useState<ModeKey>('standard');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerDownload, setViewerDownload] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleConvert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await convertImage(file, MODES[mode].params);
      if (res.status === 'success') { setResult(res); }
      else { setError(res.message || '转换失败'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败');
    } finally { setLoading(false); }
  };

  const handleDownloadSvg = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result?.svgUrl) return;
    setDownloading(true);
    try { await downloadFile(assetUrl(result.svgUrl), 'output.svg'); }
    catch (err) { alert(err instanceof Error ? err.message : '下载失败'); }
    finally { setDownloading(false); }
  };

  const clearAll = () => { setFile(null); setPreview(''); setResult(null); setError(''); };
  const openViewer = (src: string, download?: string) => { setViewerSrc(src); setViewerDownload(download); };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片转 SVG</h1>
            <p className="text-[#f2f2f2]/50">上传图片，一键生成矢量图形</p>
          </div>

          {!result ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                {...getRootProps()}
                className={`group/upload cursor-pointer transition-all ${
                  isDragActive ? 'bg-[#f9cf00]/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <input {...getInputProps()} />
                <div className="py-16 px-6">
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="预览" className="max-h-96 mx-auto rounded-xl" />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearAll(); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#f2f2f2]/40" />
                      </div>
                      <p className="text-lg font-medium mb-2">
                        {isDragActive ? (
                          '松开以上传'
                        ) : (
                          <>
                            <span className="block group-hover/upload:hidden">快速生成图片</span>
                            <span className="hidden group-hover/upload:block">点击、拖拽或粘贴图片至此</span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-[#f2f2f2]/40">
                        支持 PNG / JPG / WebP · 最大 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-white/15" />

              <div className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <ModeSelector value={mode} onChange={setMode} />
                  <div className="flex items-center gap-4 ml-auto">
                    {file && (
                      <span className="text-xs text-[#f2f2f2]/50 truncate max-w-[240px]">
                        {file.name} · {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                    <button onClick={handleConvert} disabled={loading || !file} className="btn-primary">
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 转换中</>
                      ) : (
                        <>开始生成 <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">转换结果</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/40 text-[#f9cf00] text-xs font-medium">
                    {MODES[mode].label}
                  </span>
                </div>
                <button
                  onClick={clearAll}
                  className="text-sm text-[#f2f2f2]/50 hover:text-[#f2f2f2] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 转换新图片
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">原图</p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => openViewer(assetUrl(result.originalUrl)!)}
                  >
                    <img src={assetUrl(result.originalUrl)} alt="原图" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">SVG</p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => openViewer(assetUrl(result.svgUrl)!, assetUrl(result.svgUrl)!)}
                  >
                    <img src={assetUrl(result.svgUrl)} alt="SVG" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleDownloadSvg} disabled={downloading} className="btn-primary">
                  {downloading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 下载中</>
                  ) : (
                    <><Download className="w-4 h-4" /> 下载 SVG</>
                  )}
                </button>
                <button onClick={() => router.push('/my/files')} className="btn-secondary">查看我的文件</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewerSrc && (
        <ImageViewer src={viewerSrc} alt="预览" downloadUrl={viewerDownload} onClose={() => setViewerSrc(null)} />
      )}
    </>
  );
}
""")

# ============ 2. image-upscale 页面（大卡片） ============
print("\n[2/3] image-upscale 页面")
upscale_path = FE / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx"
content = upscale_path.read_text(encoding="utf-8")

# 替换上传区结构
old_start = '''          {!result ? (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`group/upload rounded-2xl cursor-pointer transition-all border-2 border-dashed backdrop-blur-2xl ${
                  isDragActive
                    ? 'border-[#f9cf00] bg-[#f9cf00]/8'
                    : 'border-white/15 bg-white/[0.05] hover:border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
              >'''
new_start = '''          {!result ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                {...getRootProps()}
                className={`group/upload cursor-pointer transition-all ${
                  isDragActive ? 'bg-[#f9cf00]/5' : 'hover:bg-white/[0.02]'
                }`}
              >'''

content = content.replace(old_start, new_start, 1)

# 替换模式选择区容器
old_mode = '''              <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between gap-4 flex-wrap">'''
new_mode = '''              <div className="border-t border-dashed border-white/15" />

              <div className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">'''

content = content.replace(old_mode, new_mode, 1)
upscale_path.write_text(content, encoding="utf-8")
print(f"  [修改] {upscale_path.relative_to(ROOT)} - 改为大卡片布局")

# ============ 3. my/files 页面（分类标签 + 下载按钮逻辑） ============
print("\n[3/3] my/files 页面")
write(FE / "app" / "(main)" / "my" / "files" / "page.tsx", r"""'use client';

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

/** 分类标签 */
const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'SVG', label: 'SVG' },
  { key: 'PNG', label: 'PNG' },
  { key: 'JPG', label: 'JPG' },
  { key: 'OTHER', label: '其他' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

function getFileCategory(f: FileItem): CategoryKey {
  // 转换成功的有 svgUrl 且 source 为 convert
  if (f.source === 'convert' && f.svgUrl) return 'SVG';
  const fmt = (f.format || '').toUpperCase();
  if (fmt === 'SVG') return 'SVG';
  if (fmt === 'PNG') return 'PNG';
  if (fmt === 'JPG' || fmt === 'JPEG') return 'JPG';
  return 'OTHER';
}

/** 判断下载按钮的文字 */
function getDownloadLabel(f: FileItem): string {
  if (f.source === 'convert' && f.svgUrl) return '下载 SVG';
  if (f.source === 'upscale' && f.svgUrl) return '下载图片';
  return '下载文件';
}

/** 判断下载的文件名 */
function getDownloadFilename(f: FileItem): string {
  if (f.source === 'convert' && f.svgUrl) {
    return f.name.replace(/\.[^.]+$/, '') + '.svg';
  }
  if (f.source === 'upscale' && f.svgUrl) {
    return f.name.replace(/\.[^.]+$/, '') + '_upscaled.png';
  }
  return f.name;
}

/** 判断下载 URL */
function getDownloadUrl(f: FileItem): string {
  return assetUrl(f.svgUrl || f.originalUrl);
}

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
  const [category, setCategory] = useState<CategoryKey>('all');

  const load = () => {
    setLoading(true);
    getMyFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    load();
  }, [token, router]);

  // 分类过滤后的文件
  const filteredFiles = useMemo(() => {
    if (category === 'all') return files;
    return files.filter((f) => getFileCategory(f) === category);
  }, [files, category]);

  // 每个分类的数量
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = { all: files.length, SVG: 0, PNG: 0, JPG: 0, OTHER: 0 };
    files.forEach((f) => {
      const cat = getFileCategory(f);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [files]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const pagedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // 切换分类时重置页码和选择
  const handleCategoryChange = (key: CategoryKey) => {
    setCategory(key);
    setPage(1);
    setSelected(new Set());
  };

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

  const handleDownload = async (f: FileItem) => {
    try {
      await downloadFile(getDownloadUrl(f), getDownloadFilename(f));
    } catch (err) {
      alert(err instanceof Error ? err.message : '下载失败');
    }
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">我的文件</h1>
              <p className="text-sm text-[#f2f2f2]/50">
                {loading
                  ? '加载中...'
                  : `共 ${filteredFiles.length} 个文件 · 第 ${page} / ${totalPages} 页${selected.size > 0 ? ` · 已选 ${selected.size}` : ''}`}
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
                    onClick={() => { setSelectMode(false); setSelected(new Set()); }}
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
                  <Link href="/tools/image-to-svg" className="btn-primary">新建转换</Link>
                </>
              )}
            </div>
          </div>

          {/* 分类标签 */}
          {files.length > 0 && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.key] || 0;
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#f9cf00] text-black'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat.label}
                    <span className={`ml-1.5 text-xs ${active ? 'text-black/60' : 'text-white/40'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

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
              <Link href="/tools/image-to-svg" className="btn-primary">去转换一张</Link>
            </div>
          )}

          {!loading && files.length > 0 && filteredFiles.length === 0 && (
            <div className="glass-card p-16 text-center">
              <p className="text-[#f2f2f2]/60">此分类下暂无文件</p>
            </div>
          )}

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))` }}
          >
            {pagedFiles.map((f) => {
              const isSelected = selected.has(f.id);
              const imgSrc = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
              const categoryKey = getFileCategory(f);
              return (
                <div
                  key={f.id}
                  className={`glass-card transition-all ${isSelected ? 'ring-2 ring-[#f9cf00]' : ''}`}
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
                        onClick={(e) => { e.stopPropagation(); handleDeleteOne(f.id, f.name); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {selectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(f.id); }}
                        className={`absolute top-2 left-2 w-7 h-7 rounded-md flex items-center justify-center border-2 transition-all ${
                          isSelected
                            ? 'bg-[#f9cf00] border-[#f9cf00] text-black'
                            : 'bg-black/40 border-white/40 hover:border-white'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    )}

                    {/* 分类徽章 */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {categoryKey === 'SVG' && (
                        <div className="px-2 py-0.5 rounded-full bg-[#f9cf00] text-black text-[10px] font-bold">
                          SVG
                        </div>
                      )}
                      {categoryKey === 'PNG' && (
                        <div className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                          PNG
                        </div>
                      )}
                      {categoryKey === 'JPG' && (
                        <div className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                          JPG
                        </div>
                      )}
                      {categoryKey === 'OTHER' && (
                        <div className="px-2 py-0.5 rounded-full bg-gray-500 text-white text-[10px] font-bold">
                          {f.format}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="font-medium truncate mb-1 text-sm" title={f.name}>{f.name}</p>
                    <p className="text-xs text-[#f2f2f2]/40 mb-4">
                      {f.format} · {(f.size / 1024).toFixed(1)} KB
                      {f.width && f.height && ` · ${f.width}×${f.height}`}
                    </p>
                    {(f.svgUrl || f.originalUrl) && (
                      <button
                        onClick={() => handleDownload(f)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> {getDownloadLabel(f)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFiles.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[#f2f2f2]/60">
                <span>每页显示</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
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
""")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
