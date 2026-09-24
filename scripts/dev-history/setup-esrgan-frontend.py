import os
from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [创建] {path.relative_to(ROOT)}")


def patch(path, old, new, desc=""):
    if not path.exists():
        print(f"  [跳过] {path.relative_to(ROOT)} 不存在")
        return False
    content = path.read_text(encoding="utf-8")
    if new in content:
        print(f"  [已存在] {path.relative_to(ROOT)}")
        return False
    if old not in content:
        print(f"  [警告] {path.relative_to(ROOT)} 未找到锚点: {desc}")
        return False
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print(f"  [修改] {path.relative_to(ROOT)} - {desc}")
    return True


print("=" * 60)
print("Real-ESRGAN 前端集成")
print("=" * 60)
print()

# ============ 1. 类型定义 ============
print("[1/4] 类型定义")
patch(
    FE / "types" / "api.ts",
    "export interface ConvertResponse {",
    """export interface UpscaleResponse {
  fileId: number;
  status: string;
  originalUrl: string | null;
  resultUrl: string | null;
  width: number | null;
  height: number | null;
  message: string;
}

export interface ConvertResponse {""",
    "添加 UpscaleResponse 类型"
)

# ============ 2. API 客户端 ============
print("\n[2/4] API 客户端")
write(FE / "lib" / "api" / "upscale.ts", """import { request } from './client';
import type { UpscaleResponse } from '@/types/api';

export function upscaleImage(file: File, model: string = 'anime') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);

  return request<UpscaleResponse>('/api/conversions/upscale', {
    method: 'POST',
    body: formData,
  });
}
""")

# ============ 3. 导航栏加入口 ============
print("\n[3/4] 导航栏加入口")
patch(
    FE / "components" / "layout" / "header.tsx",
    "const NAV_ITEMS = [\n  { href: '/tools/image-to-svg', label: '图片转 SVG' },\n  { href: '/my/files', label: '我的文件' },\n];",
    "const NAV_ITEMS = [\n  { href: '/tools/image-to-svg', label: '图片转 SVG' },\n  { href: '/tools/image-upscale', label: '图片超分' },\n  { href: '/my/files', label: '我的文件' },\n];",
    "添加图片超分导航项"
)

# ============ 4. 超分页面 ============
print("\n[4/4] 超分页面")
write(FE / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx", """'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { upscaleImage } from '@/lib/api/upscale';
import { assetUrl } from '@/lib/api/client';
import { downloadFile } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { UpscaleResponse } from '@/types/api';
import { Image as ImageIcon, Download, X, ArrowRight, Loader2, ZoomIn, RefreshCw, Sparkles } from 'lucide-react';

const MODES = {
  anime: {
    label: '动漫插画',
    hint: '针对二次元优化',
  },
  general: {
    label: '通用图片',
    hint: '写实照片、风景',
  },
  x2: {
    label: '2倍放大',
    hint: '保守放大',
  },
} as const;

type ModeKey = keyof typeof MODES;
const MODE_KEYS: ModeKey[] = ['anime', 'general', 'x2'];

function ModeSelector({
  value,
  onChange,
}: {
  value: ModeKey;
  onChange: (v: ModeKey) => void;
}) {
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
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(key);
            }}
            className={`relative z-10 px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active ? 'text-[#f9cf00]' : 'text-white/70 hover:text-white'
            }`}
            title={MODES[key].hint}
          >
            {MODES[key].label}
          </button>
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
    if (!token) {
      router.push('/login');
      return;
    }
    if (!file) {
      setError('请先选择图片');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await upscaleImage(file, mode);
      if (res.status === 'success') {
        setResult(res);
      } else {
        setError(res.message || '超分失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '超分失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result?.resultUrl) return;
    setDownloading(true);
    try {
      await downloadFile(assetUrl(result.resultUrl), 'upscaled.png');
    } catch (err) {
      alert(err instanceof Error ? err.message : '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
  };

  const openViewer = (src: string, download?: string) => {
    setViewerSrc(src);
    setViewerDownload(download);
  };

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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片超分</h1>
            <p className="text-[#f2f2f2]/50">AI 放大图片，保留细节，提升清晰度</p>
          </div>

          {!result ? (
            <div
              {...getRootProps()}
              className={`rounded-2xl p-6 cursor-pointer transition-all border-2 border-dashed ${
                isDragActive
                  ? 'border-[#f9cf00] bg-[#f9cf00]/5'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.03]'
              }`}
            >
              <input {...getInputProps()} />

              <div className="py-12">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="预览"
                      className="max-h-96 mx-auto rounded-xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAll();
                      }}
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
                      {isDragActive ? '松开以上传' : '拖拽图片到此处'}
                    </p>
                    <p className="text-sm text-[#f2f2f2]/40">
                      或点击选择 · 支持 PNG / JPG / WebP · 最大 10MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5 flex-wrap">
                <ModeSelector value={mode} onChange={setMode} />

                <div className="flex items-center gap-4 ml-auto">
                  {file && (
                    <span className="text-xs text-[#f2f2f2]/50 truncate max-w-[240px]">
                      {file.name} · {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <button
                    onClick={handleUpscale}
                    disabled={loading || !file}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> 超分中
                      </>
                    ) : (
                      <>
                        开始超分 <ArrowRight className="w-4 h-4" />
                      </>
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
                    <img
                      src={assetUrl(result.originalUrl)}
                      alt="原图"
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
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
                    <img
                      src={assetUrl(result.resultUrl)}
                      alt="超分后"
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {result.width && result.height && (
                <p className="text-sm text-[#f2f2f2]/50 mb-4">
                  输出尺寸：{result.width} × {result.height}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 下载中
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> 下载图片
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push('/my/files')}
                  className="btn-secondary"
                >
                  查看我的文件
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
""")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
