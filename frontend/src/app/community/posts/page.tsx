'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { searchPagedPosts, listAllTags } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { PostItem, PostTag } from '@/types/api';
import {
  Loader2, Heart, MessageCircle, Eye, ImageOff,
  ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight,
  LayoutGrid, Hash, X,
} from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'hot',      label: '热度' },
  { key: 'latest',   label: '最新发布' },
  { key: 'like',     label: '最多点赞' },
  { key: 'comment',  label: '最多评论' },
  { key: 'favorite', label: '最多收藏' },
  { key: 'view',     label: '最多浏览' },
] as const;

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export default function PostsPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center text-white/40">
          <Loader2 className="w-6 h-6 animate-spin" />
        </main>
      </>
    }>
      <PostsContent />
    </Suspense>
  );
}

function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState<string>('latest');
  const [order, setOrder] = useState<string>('desc');
  const [tagId, setTagId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(24);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<PostTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  // URL 参数：tagId
  useEffect(() => {
    const tid = searchParams.get('tagId');
    if (tid) setTagId(Number(tid));
  }, [searchParams]);

  // 加载标签
  useEffect(() => {
    listAllTags().then(setTags).catch(() => {});
  }, []);

  // 加载作品
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    searchPagedPosts({
      sort, order,
      tagId: tagId ?? undefined,
      page, size,
    })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sort, order, tagId, page, size]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentSort = SORT_OPTIONS.find((s) => s.key === sort)?.label || '最新发布';
  const currentTag = tags.find((t) => t.id === tagId);

  const clearTag = () => {
    setTagId(null);
    setPage(1);
    router.replace('/community/posts');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50 mb-5">
            <Link href="/community" className="hover:text-white transition-colors">社区</Link>
            <span>/</span>
            <span className="text-[#f2f2f2]/80">
              {currentTag ? `标签：${currentTag.name}` : '公开作品'}
            </span>
          </div>

          {/* 标题 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <LayoutGrid className="w-7 h-7 text-[#f9cf00]" />
              {currentTag ? `#${currentTag.name}` : '公开作品'}
            </h1>
            <p className="text-sm text-[#f2f2f2]/50">
              共 {total} 件作品
            </p>
          </div>

          {/* 排序 + 标签筛选 */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 排序下拉 */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((v) => !v)}
                    onBlur={() => setTimeout(() => setSortOpen(false), 150)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition-colors"
                  >
                    {currentSort}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute z-30 top-full mt-2 w-40 rounded-xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setSort(opt.key); setPage(1); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                            sort === opt.key ? 'text-[#f9cf00]' : 'text-white/80'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 升降序 */}
                <button
                  onClick={() => { setOrder((o) => o === 'desc' ? 'asc' : 'desc'); setPage(1); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {order === 'desc' ? '降序' : '升序'}
                </button>

                {/* 已选标签 */}
                {currentTag && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f9cf00]/10 border border-[#f9cf00]/30 text-[#f9cf00] text-sm">
                    <Hash className="w-3.5 h-3.5" />
                    {currentTag.name}
                    <button onClick={clearTag} className="ml-1 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#f2f2f2]/50">每页</span>
                <select
                  value={size}
                  onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-[#f9cf00] transition-colors"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n} className="bg-[#15161a]">{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 标签横向滚动条 */}
            {tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={clearTag}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                    tagId == null
                      ? 'bg-[#f9cf00] text-black'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  全部
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTagId(t.id); setPage(1); }}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                      tagId === t.id
                        ? 'bg-[#f9cf00] text-black'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {t.name} ({t.usageCount})
                  </button>
                ))}
              </div>
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

          {!loading && posts.length === 0 && (
            <div className="glass-card p-16 text-center">
              <ImageOff className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
              <p className="text-[#f2f2f2]/60 mb-4">没有符合条件的作品</p>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          )}

          {/* 居中分页器 */}
          {!loading && total > 0 && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
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
          )}
        </div>
      </main>
    </>
  );
}

function PostCard({ post }: { post: PostItem }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';
  return (
    <Link
      href={`/community/post/${post.id}`}
      className="group glass-card overflow-hidden transition-all hover:border-[#f9cf00]/40 hover:shadow-lg hover:shadow-[#f9cf00]/5"
    >
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        {cover ? (
          <img src={cover} alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/30">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium truncate mb-2 text-sm group-hover:text-[#f9cf00] transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-[#f2f2f2]/50">
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likeCount}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}</span>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.viewCount}</span>
        </div>
      </div>
    </Link>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 4) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}