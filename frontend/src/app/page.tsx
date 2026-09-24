'use client';

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
    title: 'AI 放大',
    subtitle: '画质增强',
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
            图片转 SVG · AI 图片放大 · 一站式矢量图形创作平台
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
        Vector Graphics · 图片转 SVG + AI 放大
      </footer>
    </div>
  );
}
