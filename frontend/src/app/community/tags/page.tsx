'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { listAllTags } from '@/lib/api/community';
import type { PostTag } from '@/types/api';
import {
  Loader2, ArrowLeft, Hash, Search as SearchIcon, X,
} from 'lucide-react';

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<PostTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllTags()
      .then((res) => {
        if (!cancelled) setTags(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // 前端过滤：空格分隔多关键字（AND）
  const filtered = useMemo(() => {
    const kw = filter.trim().toLowerCase();
    if (!kw) return tags;
    const parts = kw.split(/\s+/).filter(Boolean);
    return tags.filter((t) =>
      parts.every((p) => t.name.toLowerCase().includes(p))
    );
  }, [tags, filter]);

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* 返回 */}
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-[#f2f2f2]/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回广场
          </Link>

          {/* 标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Hash className="w-7 h-7 text-[#f9cf00]" />
              标签列表
            </h1>
            <p className="text-sm text-[#f2f2f2]/50">
              这里是本站作品中的所有标签，点击标签浏览相关作品
            </p>
          </div>

          {/* 搜索框 */}
          <div className="mb-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-[#f9cf00]/50 transition-colors">
            <SearchIcon className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="可以用空格分隔多个搜索关键字"
              className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-sm"
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20 text-[#f2f2f2]/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="glass-card p-16 text-center text-[#f2f2f2]/50">
              <Hash className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
              <p>{tags.length === 0 ? '还没有任何标签' : '没有匹配的标签'}</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/community/posts?tagId=${tag.id}`}
                  className="glass-card p-5 flex items-center justify-between gap-3 hover:border-[#f9cf00]/40 hover:bg-white/[0.07] transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#f9cf00]/10 border border-[#f9cf00]/20 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4 text-[#f9cf00]" />
                    </span>
                    <span className="font-medium text-white truncate group-hover:text-[#f9cf00] transition-colors">
                      {tag.name}
                    </span>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#f2f2f2]/60">
                    {tag.usageCount} 个作品
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}