'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { listPosts, listPostsByUser } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { PostItem, PageResponse } from '@/types/api';
import {
  Heart, MessageCircle, Eye, Loader2, Plus,
  Clock, Star, ImageOff, ChevronLeft, ChevronRight, Flame,
  User as UserIcon, LayoutGrid, CheckCircle2, Search as SearchIcon,
  ZoomIn, ZoomOut,
} from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'latest',   label: '最新',     icon: Clock },
  { key: 'like',     label: '最多点赞', icon: Heart },
  { key: 'comment',  label: '最多评论', icon: MessageCircle },
  { key: 'favorite', label: '最多收藏', icon: Star },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['key'];

const PAGE_SIZE_OPTIONS = [12, 20, 40, 60];

export default function CommunityPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [sort, setSort] = useState<SortKey>('latest');
  const [myOnly, setMyOnly] = useState(false);
  const [cardWidth, setCardWidth] = useState(260);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // URL 参数处理
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('toast');
    if (t) {
      setToast(t);
      const url = new URL(window.location.href);
      url.searchParams.delete('toast');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 加载列表
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const fetchPromise: Promise<PageResponse<PostItem>> =
      myOnly && user
        ? listPostsByUser(user.id, page, size)
        : listPosts({ sort, page, size });

    fetchPromise
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
  }, [sort, page, size, myOnly, user, token]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  const handleSort = (key: SortKey) => {
    setSort(key);
    setPage(1);
  };

  const handleToggleMyOnly = () => {
    if (!token) return;
    setMyOnly((v) => !v);
    setPage(1);
  };

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    router.push(`/community/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f9cf00] text-black shadow-2xl">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{toast}</span>
            </div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto">
          {/* 标题 + 发布按钮 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Flame className="w-7 h-7 text-[#f9cf00]" />
                {myOnly ? '我的发布' : '社区广场'}
              </h1>
              <p className="text-sm text-[#f2f2f2]/50">
                {loading ? '加载中...' : `共 ${total} 件作品`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/community/ranking" className="btn-secondary">
                <Flame className="w-4 h-4" /> 热度排行
              </Link>
              <Link href="/community/publish" className="btn-primary">
                <Plus className="w-4 h-4" /> 发布作品
              </Link>
            </div>
          </div>

          {/* 搜索框（放在排序上方） */}
          <div className="mb-5 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-[#f9cf00]/50 transition-colors">
            <SearchIcon className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="搜索作品、用户、标签..."
              className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={!searchInput.trim()}
              className="px-4 py-1 rounded-lg bg-[#f9cf00] text-black text-xs font-medium hover:bg-[#e6bf00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 筛选 + 缩放控制 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = !myOnly && sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => { setMyOnly(false); handleSort(opt.key); }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#f9cf00] text-black'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}

              {hydrated && token && (
                <>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={handleToggleMyOnly}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      myOnly
                        ? 'bg-[#f9cf00] text-black'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {myOnly ? <UserIcon className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                    {myOnly ? '返回广场' : '我的发布'}
                  </button>
                </>
              )}
            </div>

            {/* 缩放滑块 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <ZoomOut className="w-4 h-4 text-[#f2f2f2]/40" />
              <input
                type="range"
                min={180}
                max={420}
                step={20}
                value={cardWidth}
                onChange={(e) => setCardWidth(Number(e.target.value))}
                className="w-28 accent-[#f9cf00]"
              />
              <ZoomIn className="w-4 h-4 text-[#f2f2f2]/40" />
            </div>
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-[#f2f2f2]/40" />
              </div>
              <p className="text-[#f2f2f2]/60 mb-4">
                {myOnly ? '你还没有发布任何作品' : '还没有作品，来发布第一个吧'}
              </p>
              <Link href="/community/publish" className="btn-primary">
                <Plus className="w-4 h-4" /> 发布作品
              </Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))` }}
            >
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {!loading && total > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[#f2f2f2]/60">
                <span>每页显示</span>
                <select
                  value={size}
                  onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
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
    </>
  );
}

/** 单个作品卡片（带 hover 悬浮预览小卡片） */
function PostCard({ post }: { post: PostItem }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';
  return (
    <div className="relative group">
      <Link
        href={`/community/post/${post.id}`}
        className="block glass-card overflow-hidden transition-all hover:border-[#f9cf00]/40"
      >
        <div className="relative aspect-square bg-white/5 overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={post.title}
              className="w-full h-full object-contain transition-transform group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/30">
              <ImageOff className="w-10 h-10" />
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="font-medium truncate mb-2 text-sm" title={post.title}>
            {post.title}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-[10px] font-bold overflow-hidden shrink-0">
              {post.userAvatar ? (
                <img src={assetUrl(post.userAvatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                (post.username?.[0] || '?').toUpperCase()
              )}
            </div>
            <span className="text-xs text-[#f2f2f2]/60 truncate">{post.username || '匿名'}</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#f2f2f2]/60"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-[#f2f2f2]/50">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {post.viewCount}
            </span>
          </div>
        </div>
      </Link>

      {/* hover 悬浮预览：只在有 description 时显示 */}
      {post.description && (
        <div className="pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-3 w-[min(90%,320px)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <div className="rounded-xl bg-[#15161a] border border-white/10 shadow-2xl p-4">
            <p className="text-xs font-semibold text-[#f9cf00] mb-1.5">作品描述</p>
            <p className="text-xs text-white/80 leading-relaxed line-clamp-4">
              {post.description}
            </p>
          </div>
          {/* 小三角 */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#15161a] border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </div>
  );
}

/** 生成分页数字序列 */
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