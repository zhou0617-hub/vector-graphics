'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { ParticleProgress } from '@/components/particle-progress';
import { upscaleImage } from '@/lib/api/upscale';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { preloadImage } from '@/lib/utils/preload';
import { useAuthStore } from '@/stores/auth-store';
import type { UpscaleResponse } from '@/types/api';
import { ImagePlus, FolderUp, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles, Clock, StopCircle } from 'lucide-react';

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
      <div className="absolute top-1 bottom-1 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/50 transition-all duration-300 ease-out pointer-events-none" style={{ left: `calc(4px + ${index} * (100% - 8px) / 3)`, width: `calc((100% - 8px) / 3)` }} />
      {MODE_KEYS.map((key) => {
        const active = key === value;
        const mode = MODES[key];
        return (
          <div key={key} className="relative group/mode">
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(key); }} className={`relative z-10 w-full px-3 py-1.5 rounded-full text-sm font-medium text-center transition-colors ${active ? 'text-[#f9cf00]' : 'text-white/70 hover:text-white'}`}>{mode.label}</button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 rounded-xl bg-[#15161a] border border-white/10 shadow-2xl opacity-0 invisible group-hover/mode:opacity-100 group-hover/mode:visible transition-all duration-200 pointer-events-none z-50">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-9 h-9 rounded-lg bg-[#f9cf00]/15 flex items-center justify-center text-[#f9cf00] shrink-0"><Sparkles className="w-4 h-4" /></span>
                <div className="min-w-0"><h4 className="font-semibold text-sm text-white">{mode.label}</h4><p className="text-xs text-white/40">{mode.short}</p></div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">{mode.description}</p>
              <div className="flex flex-col gap-1.5 text-xs pt-3 border-t border-white/5">
                <div className="flex justify-between"><span className="text-white/40">适合</span><span className="text-white/80">{mode.suitable}</span></div>
                <div className="flex justify-between"><span className="text-white/40">模型</span><span className="text-white/60 font-mono text-[10px]">{mode.output}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> 预计</span><span className="text-[#f9cf00] font-medium">{mode.estimate}</span></div>
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

  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingResultRef = useRef<UpscaleResponse | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview('');
    setTimeout(() => {
      setPreview(URL.createObjectURL(f));
    }, 0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpscale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { router.push('/login'); return; }
    if (!file) { setError('请先选择图片'); return; }

    pendingResultRef.current = null;
    setProgress(0);
    setError('');
    setShowProgress(false);
    await new Promise((r) => setTimeout(r, 50));
    setShowProgress(true);
    const startTime = Date.now();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        const elapsed = Date.now() - startTime;
        const target = elapsed < 3000 ? (elapsed / 3000) * 60 : 60 + Math.min(30, (elapsed - 3000) / 10000 * 30);
        return Math.min(90, Math.max(p, target));
      });
    }, 200);

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await upscaleImage(file, mode, controller.signal);
      if (res.status === 'success' && res.originalUrl && res.resultUrl) {
        try {
          await Promise.all([preloadImage(assetUrl(res.originalUrl)), preloadImage(assetUrl(res.resultUrl))]);
        } catch (err) { console.warn('预加载失败', err); }
        setProgress(100);
        await new Promise((r) => setTimeout(r, 4000));
        setResult(res);
        setShowProgress(false);
        setLoading(false);
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      } else {
        setError(res.message || '超分失败');
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setLoading(false);
        setShowProgress(false);
      }
    } catch (err) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setLoading(false);
      setShowProgress(false);
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消
      } else {
        setError(err instanceof Error ? err.message : '超分失败');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleRegatherComplete = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    const res = pendingResultRef.current;
    if (res) {
      setResult(res);
      pendingResultRef.current = null;
    }
    setLoading(false);
    setShowProgress(false);
    setProgress(0);
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    pendingResultRef.current = null;
    setProgress(0);
    setShowProgress(false);
    setLoading(false);
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
              <Sparkles className="w-4 h-4 text-[#f9cf00]" /> Real-ESRGAN 超分
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">AI 放大</h1>
            <p className="text-[#f2f2f2]/50">AI 放大图片，保留细节，提升清晰度</p>
          </div>

          {!result ? (
            <div className="glass-card rounded-2xl">
              <div {...getRootProps()} className={`group/upload cursor-pointer transition-all rounded-t-2xl ${isDragActive ? 'bg-[#f9cf00]/5' : 'hover:bg-white/[0.02]'}`}>
                <input {...getInputProps()} />
                <div className="py-16 px-6">
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="预览" className="max-h-96 mx-auto rounded-xl" />
                      <button onClick={(e) => { e.stopPropagation(); clearAll(); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImagePlus className={`absolute w-10 h-10 text-[#f2f2f2]/40 transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`} />
                        <FolderUp className={`absolute w-10 h-10 text-[#f9cf00] transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`} />
                      </div>
                      <div className="relative h-7 mb-2">
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-0' : 'opacity-100 group-hover/upload:opacity-0'}`}>快速生成图片</span>
                        <span className={`absolute inset-0 flex items-center justify-center text-lg font-medium transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'}`}>{isDragActive ? '松开以上传' : '点击、拖拽或粘贴图片至此'}</span>
                      </div>
                      <p className="text-sm text-[#f2f2f2]/40">支持 PNG / JPG / WebP · 最大 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-dashed border-white/15" />
              <div className="p-4 rounded-b-2xl">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <ModeSelector value={mode} onChange={setMode} />
                  <div className="flex items-center gap-4 ml-auto">
                    {file && <span className="text-xs text-[#f2f2f2]/50 truncate max-w-[240px]">{file.name} · {(file.size / 1024).toFixed(1)} KB</span>}
                    <button onClick={handleUpscale} disabled={loading || !file} className="btn-primary">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 超分中</> : <>开始超分 <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </div>
                {error && <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">超分结果</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/40 text-[#f9cf00] text-xs font-medium">{MODES[mode].label}</span>
                </div>
                <button onClick={clearAll} className="text-sm text-[#f2f2f2]/50 hover:text-[#f2f2f2] transition-colors flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> 处理新图片
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">原图</p>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group" style={{ aspectRatio: '1 / 1' }} onClick={() => openViewer(assetUrl(result.originalUrl)!)}>
                    <img src={assetUrl(result.originalUrl)} alt="原图" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><ZoomIn className="w-6 h-6" /></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">超分后</p>
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group" style={{ aspectRatio: '1 / 1' }} onClick={() => openViewer(assetUrl(result.resultUrl)!, assetUrl(result.resultUrl)!)}>
                    <img src={assetUrl(result.resultUrl)} alt="超分后" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><ZoomIn className="w-6 h-6" /></div>
                  </div>
                </div>
              </div>

              {result.width && result.height && <p className="text-sm text-[#f2f2f2]/50 mb-4">输出尺寸：{result.width} × {result.height}</p>}

              <div className="flex gap-3">
                <button onClick={handleDownload} disabled={downloading} className="btn-primary">
                  {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> 下载中</> : <><Download className="w-4 h-4" /> 下载图片</>}
                </button>
                <button onClick={() => router.push('/my/files')} className="btn-secondary">查看我的文件</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showProgress && preview && (
        <div className="fixed inset-0 z-[200] bg-black/88 backdrop-blur-md flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-[900px]" style={{ height: 'min(65vh, 600px)' }}>
            <ParticleProgress imageUrl={preview} progress={progress} onRegatherComplete={handleRegatherComplete} />
          </div>
          <div className="mt-6 text-center">
            <p className="text-lg font-medium text-white mb-2">生成中... {Math.floor(progress)}%</p>
            <p className="text-sm text-white/40 mb-4">{MODES[mode].label}模式 · 预计 {MODES[mode].estimate.replace('约 ', '')}</p>
            <button onClick={handleCancel} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/15 transition-colors text-sm">
              <StopCircle className="w-4 h-4" /> 终止转换
            </button>
          </div>
        </div>
      )}

      {viewerSrc && <ImageViewer src={viewerSrc} alt="预览" downloadUrl={viewerDownload} onClose={() => setViewerSrc(null)} />}
    </>
  );
}
