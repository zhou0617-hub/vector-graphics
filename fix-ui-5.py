import os
from pathlib import Path

ROOT = Path(__file__).parent
FE = ROOT / "frontend" / "src"

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [重写] {path.relative_to(ROOT)}")

print("=" * 60)
print("前端 5 项修改")
print("=" * 60)
print()

# ============ 1. Header：导航栏全宽 ============
print("[1/5] Header 导航栏")
write(FE / "components" / "layout" / "header.tsx", r"""'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { assetUrl } from '@/lib/api/client';
import { Sparkles, User, LogOut, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/tools/image-to-svg', label: '图片转 SVG' },
  { href: '/tools/image-upscale', label: '图片超分' },
  { href: '/my/files', label: '我的文件' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hydrated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        {/* 左侧：Logo + 导航卡片 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold shrink-0 text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="hidden sm:inline">Vector Graphics</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-white/90 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#f9cf00]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 右侧：用户区 */}
        <div className="flex items-center gap-3 text-sm">
          {hydrated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-1.5 py-1.5 pr-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-xs font-bold overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={assetUrl(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                <span className="text-white/90 max-w-[100px] truncate">{user.username}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden">
                  <div className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black font-bold text-lg overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={assetUrl(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          user.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-white">{user.username}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人主页
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : hydrated ? (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full text-white/90 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link href="/register" className="btn-primary">注册</Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
""")

# ============ 2. 首页：重写为项目介绍 ============
print("\n[2/5] 首页")
write(FE / "app" / "page.tsx", r"""'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/stores/auth-store';
import { Image as ImageIcon, Sparkles, FolderOpen, ArrowRight, Zap, Wand2 } from 'lucide-react';

const FEATURES = [
  {
    key: 'svg',
    href: '/tools/image-to-svg',
    icon: ImageIcon,
    title: '图片转 SVG',
    subtitle: '矢量图形',
    description: '上传 PNG / JPG / WebP 图片，一键转换为可无限缩放的 SVG 矢量图形，适合图标、Logo、插画等场景',
    tags: ['三档精度', 'SVG 输出'],
    cta: '开始转换',
  },
  {
    key: 'upscale',
    href: '/tools/image-upscale',
    icon: Sparkles,
    title: '图片超分',
    subtitle: 'AI 放大',
    description: '基于 Real-ESRGAN 深度学习模型，智能放大图片并补充细节，保留线条和纹理，支持 GPU 加速',
    tags: ['4 倍放大', 'AI 增强'],
    cta: '开始超分',
  },
  {
    key: 'files',
    href: '/my/files',
    icon: FolderOpen,
    title: '我的文件',
    subtitle: '文件管理',
    description: '集中管理所有转换和超分生成的文件，支持分类筛选、批量删除、下载和在线预览',
    tags: ['分类管理', '批量操作'],
    cta: '查看文件',
  },
];

export default function HomePage() {
  const { user, hydrated } = useAuthStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#f9cf00]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#ff9500]/5 blur-[100px] rounded-full" />
      </div>

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#f9cf00] animate-pulse" />
            全新矢量化 + AI 超分引擎
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            准备好开始
            <br />
            <span className="bg-gradient-to-r from-[#f9cf00] to-[#ff9500] bg-clip-text text-transparent">
              矢量创作
            </span>
            了吗？
          </h1>

          <p className="text-lg text-[#f2f2f2]/60 max-w-2xl mx-auto">
            图片转 SVG · AI 图片超分 · 一站式矢量图形创作平台
          </p>

          {hydrated && !user && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Link href="/register" className="btn-primary px-6 py-2.5">
                免费注册 <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-2.5">
                已有账号
              </Link>
            </div>
          )}
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="glass-card rounded-2xl overflow-hidden group/card">
                <Link href={f.href} className="block p-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#f9cf00]/10 flex items-center justify-center text-[#f9cf00] shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-white mb-0.5">{f.title}</h3>
                      <p className="text-xs text-white/40">{f.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#f2f2f2]/60 leading-relaxed mb-4">{f.description}</p>
                  <div className="flex items-center gap-2">
                    {f.tags.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>

                <div className="border-t border-dashed border-white/15" />

                <div className="p-4">
                  <Link href={f.href} className="btn-primary w-full">
                    {f.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 技术亮点 */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#f9cf00]/10 flex items-center justify-center text-[#f9cf00] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">GPU 加速超分</h3>
              <p className="text-sm text-[#f2f2f2]/50 leading-relaxed">
                基于 RTX 系列 GPU 的 AI 推理，512×512 图片约 1-3 秒完成 4 倍放大
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#f9cf00]/10 flex items-center justify-center text-[#f9cf00] mb-4">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">三档精度可调</h3>
              <p className="text-sm text-[#f2f2f2]/50 leading-relaxed">
                标准 / 高精度 / 超高清，不同文件大小与细节保留程度，满足不同场景需求
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-[#f2f2f2]/40">
        Vector Graphics · 图片转 SVG + AI 超分
      </footer>
    </div>
  );
}
""")

# ============ 3. image-to-svg：修复弹窗裁剪 + 文字渐变 + 模式居中 ============
print("\n[3/5] image-to-svg 页面")
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
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#f2f2f2]/40" />
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

# ============ 4. image-upscale：同款修复 ============
print("\n[4/5] image-upscale 页面")
write(FE / "app" / "(main)" / "tools" / "image-upscale" / "page.tsx", r"""'use client';

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
  x2: {
    label: '2倍放大',
    short: '保守放大',
    description: '只放大 2 倍，输出更自然，适合已经比较清晰的图片做轻微提升',
    suitable: '清晰的照片、插画',
    output: 'RealESRGAN_x2plus',
  },
  anime: {
    label: '动漫插画',
    short: '二次元专用',
    description: '针对动漫、插画、漫画优化，线条锐利，色块干净，保留原始风格',
    suitable: '动漫、漫画、插画',
    output: 'RealESRGAN_x4plus_anime_6B',
  },
  general: {
    label: '通用图片',
    short: '照片通用',
    description: '通用 4 倍放大，还原真实细节和纹理，适合大多数场景',
    suitable: '照片、风景、人像',
    output: 'RealESRGAN_x4plus',
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
      if (res.status === 'success') { setResult(res); }
      else { setError(res.message || '超分失败'); }
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片超分</h1>
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
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#f2f2f2]/40" />
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

# ============ 5. 首页登录态（已在首页里处理） ============
print("\n[5/5] 首页登录态已在首页组件中处理")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
