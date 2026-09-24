import os
from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [重写] {path.relative_to(ROOT)}")

print("=" * 60)
print("修复图片显示 + 模式预估时间")
print("=" * 60)
print()

# ============ 1. image-to-svg ============
print("[1/2] image-to-svg 页面")
write(FE / "app" / "(main)" / "tools" / "image-to-svg" / "page.tsx", r"""'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { convertImage } from '@/lib/api/conversion';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { preloadImage } from '@/lib/utils/preload';
import { useAuthStore } from '@/stores/auth-store';
import type { ConvertResponse } from '@/types/api';
import { ImagePlus, FolderUp, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles, Clock } from 'lucide-react';

const MODES = {
  standard: {
    label: '标准',
    short: '快速转换',
    description: '快速矢量化，文件小，适合图标、Logo 等简单图形',
    suitable: '图标、Logo、简单插画',
    output: '文件最小，速度最快',
    estimate: '约 1-5 秒',
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
    estimate: '约 5-30 秒',
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
    description: '最大程度还原细节，渐变过渡更平滑，文件最大，适合专业场景',
    suitable: '需要印刷、专业设计',
    output: '文件最大，渐变最平滑',
    estimate: '约 1-3 分钟',
    params: {
      color_precision: 8,
      layer_difference: 2,
      length_threshold: 1.2,
      filter_speckle: 0,
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
    <div className="relative grid grid-cols-3 w-[360px] rounded-full bg-white/5 border border-white/10 p-1 select-none">
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
              className={`relative z-10 w-full px-3 py-1.5 rounded-full text-sm font-medium text-center transition-colors ${
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
                <div className="flex justify-between items-center">
                  <span className="text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 预计
                  </span>
                  <span className="text-[#f9cf00] font-medium">{mode.estimate}</span>
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
      if (res.status === 'success' && res.originalUrl && res.svgUrl) {
        // 关键：预加载两张图片，全部加载完才 setResult
        try {
          await Promise.all([
            preloadImage(assetUrl(res.originalUrl)),
            preloadImage(assetUrl(res.svgUrl)),
          ]);
        } catch (err) {
          console.warn('图片预加载失败，继续显示', err);
        }
        setResult(res);
      } else {
        setError(res.message || '转换失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败');
    } finally {
      setLoading(false);
    }
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70 mb-4">
              <Sparkles className="w-4 h-4 text-[#f9cf00]" />
              VTracer 矢量化
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片转 SVG</h1>
            <p className="text-[#f2f2f2]/50">上传图片，一键生成矢量图形</p>
          </div>

          {!result ? (
            <div className="glass-card rounded-2xl">
              <div
                {...getRootProps()}
                className={`group/upload cursor-pointer transition-all rounded-t-2xl ${
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
                      <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImagePlus className={`absolute w-10 h-10 text-[#f2f2f2]/40 transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`} />
                        <FolderUp className={`absolute w-10 h-10 text-[#f9cf00] transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`} />
                      </div>
                      <div className="relative h-7 mb-2">
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`}>
                          快速生成图片
                        </span>
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`}>
                          {isDragActive ? '松开以上传' : '点击、拖拽或粘贴图片至此'}
                        </span>
                      </div>
                      <p className="text-sm text-[#f2f2f2]/40">
                        支持 PNG / JPG / WebP · 最大 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-white/15" />

              <div className="p-4 rounded-b-2xl">
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

# ============ 2. image-upscale ============
print("\n[2/2] image-upscale 页面")
write(FE / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx", r"""'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { upscaleImage } from '@/lib/api/upscale';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { preloadImage } from '@/lib/utils/preload';
import { useAuthStore } from '@/stores/auth-store';
import type { UpscaleResponse } from '@/types/api';
import { ImagePlus, FolderUp, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles, Clock } from 'lucide-react';

const MODES = {
  x2: {
    label: '2倍放大',
    short: '保守放大',
    description: '只放大 2 倍，输出更自然，适合已经比较清晰的图片做轻微提升',
    suitable: '清晰的照片、插画',
    output: 'RealESRGAN_x2plus',
    estimate: '约 2-5 秒',
  },
  anime: {
    label: '动漫插画',
    short: '二次元专用',
    description: '针对动漫、插画、漫画优化，线条锐利，色块干净，保留原始风格',
    suitable: '动漫、漫画、插画',
    output: 'RealESRGAN_x4plus_anime_6B',
    estimate: '约 1-3 秒',
  },
  general: {
    label: '通用图片',
    short: '照片通用',
    description: '通用 4 倍放大，还原真实细节和纹理，适合大多数场景',
    suitable: '照片、风景、人像',
    output: 'RealESRGAN_x4plus',
    estimate: '约 3-8 秒',
  },
} as const;

type ModeKey = keyof typeof MODES;
const MODE_KEYS: ModeKey[] = ['x2', 'anime', 'general'];

function ModeSelector({ value, onChange }: { value: ModeKey; onChange: (v: ModeKey) => void }) {
  const index = MODE_KEYS.indexOf(value);

  return (
    <div className="relative grid grid-cols-3 w-[360px] rounded-full bg-white/5 border border-white/10 p-1 select-none">
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
              className={`relative z-10 w-full px-3 py-1.5 rounded-full text-sm font-medium text-center transition-colors ${
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
                  <span className="text-white/40">模型</span>
                  <span className="text-white/60 font-mono text-[10px]">{mode.output}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 预计
                  </span>
                  <span className="text-[#f9cf00] font-medium">{mode.estimate}</span>
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

export default function ImageUpscalePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [mode, setMode] = useState<ModeKey>('anime');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<UpscaleResponse | null>(null);
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

  const handleUpscale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await upscaleImage(file, mode);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        try {
          await Promise.all([
            preloadImage(assetUrl(res.originalUrl)),
            preloadImage(assetUrl(res.resultUrl)),
          ]);
        } catch (err) {
          console.warn('图片预加载失败，继续显示', err);
        }
        setResult(res);
      } else {
        setError(res.message || '超分失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '超分失败');
    } finally { setLoading(false); }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result?.resultUrl) return;
    setDownloading(true);
    try { await downloadFile(assetUrl(result.resultUrl), 'upscaled.png'); }
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70 mb-4">
              <Sparkles className="w-4 h-4 text-[#f9cf00]" />
              Real-ESRGAN 超分
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">AI 放大</h1>
            <p className="text-[#f2f2f2]/50">AI 放大图片，保留细节，提升清晰度</p>
          </div>

          {!result ? (
            <div className="glass-card rounded-2xl">
              <div
                {...getRootProps()}
                className={`group/upload cursor-pointer transition-all rounded-t-2xl ${
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
                      <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImagePlus className={`absolute w-10 h-10 text-[#f2f2f2]/40 transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`} />
                        <FolderUp className={`absolute w-10 h-10 text-[#f9cf00] transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`} />
                      </div>
                      <div className="relative h-7 mb-2">
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`}>
                          快速生成图片
                        </span>
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`}>
                          {isDragActive ? '松开以上传' : '点击、拖拽或粘贴图片至此'}
                        </span>
                      </div>
                      <p className="text-sm text-[#f2f2f2]/40">
                        支持 PNG / JPG / WebP · 最大 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-white/15" />

              <div className="p-4 rounded-b-2xl">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <ModeSelector value={mode} onChange={setMode} />
                  <div className="flex items-center gap-4 ml-auto">
                    {file && (
                      <span className="text-xs text-[#f2f2f2]/50 truncate max-w-[240px]">
                        {file.name} · {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                    <button onClick={handleUpscale} disabled={loading || !file} className="btn-primary">
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 超分中</>
                      ) : (
                        <>开始超分 <ArrowRight className="w-4 h-4" /></>
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
                  <h2 className="text-xl font-semibold">超分结果</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/40 text-[#f9cf00] text-xs font-medium">
                    {MODES[mode].label}
                  </span>
                </div>
                <button
                  onClick={clearAll}
                  className="text-sm text-[#f2f2f2]/50 hover:text-[#f2f2f2] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 处理新图片
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
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">超分后</p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => openViewer(assetUrl(result.resultUrl)!, assetUrl(result.resultUrl)!)}
                  >
                    <img src={assetUrl(result.resultUrl)} alt="超分后" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {result.width && result.height && (
                <p className="text-sm text-[#f2f2f2]/50 mb-4">输出尺寸：{result.width} × {result.height}</p>
              )}

              <div className="flex gap-3">
                <button onClick={handleDownload} disabled={downloading} className="btn-primary">
                  {downloading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 下载中</>
                  ) : (
                    <><Download className="w-4 h-4" /> 下载图片</>
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

print()
print("=" * 60)
print("完成！")
print("=" * 60)
