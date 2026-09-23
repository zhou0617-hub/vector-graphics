import Link from 'next/link';
import { Sparkles, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#f9cf00]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#ff9500]/5 blur-[100px] rounded-full" />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span>Vector Graphics</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="px-4 py-1.5 text-[#f2f2f2]/80 hover:text-[#f2f2f2]">
            登录
          </Link>
          <Link href="/register" className="btn-primary">
            免费注册
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#f9cf00] animate-pulse" />
            全新矢量化引擎
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            准备好开始{' '}
            <span className="bg-gradient-to-r from-[#f9cf00] to-[#ff9500] bg-clip-text text-transparent">
              矢量创作
            </span>
            <br />
            了吗？
          </h1>
          <p className="text-lg text-[#f2f2f2]/60 max-w-2xl mx-auto">
            上传图片，一键生成高质量 SVG 矢量图形
          </p>
        </div>

        <div className="glass-card p-8 md:p-12 max-w-3xl mx-auto mb-20">
          <Link
            href="/tools/image-to-svg"
            className="block text-center py-16 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#f9cf00]/50 transition-all group"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#f9cf00]/10 transition-all">
              <ImageIcon className="w-8 h-8 text-[#f2f2f2]/60 group-hover:text-[#f9cf00] transition-colors" />
            </div>
            <p className="text-lg font-medium mb-2">从图片快速生成</p>
            <p className="text-sm text-[#f2f2f2]/50">支持 PNG / JPG / WebP</p>
          </Link>

          <div className="flex justify-end mt-6">
            <Link href="/tools/image-to-svg" className="btn-primary">
              开始生成 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            免费注册，开始创作 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-[#f2f2f2]/40">
        Vector Graphics · 图片转 SVG 工具
      </footer>
    </div>
  );
}
