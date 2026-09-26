'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { searchPosts, searchUsers, searchTags, listAllTags } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { PostItem, PostTag, UserBrief } from '@/types/api';
import {
  Search as SearchIcon, Loader2, Heart, MessageCircle,
  Eye, ImageOff, Hash, User as UserIcon,
  History, X, Filter, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';

const HISTORY_KEY = 'community_search_history';
const HISTORY_MAX = 10;

const TABS = [
  { key: 'posts', label: '作品' },
  { key: 'users', label: '用户' },
  { key: 'tags',  label: '标签' },
] as const;

type TabKey = typeof TABS[number]['key'];

const RANGE_OPTIONS = [
  { key: 'all',   label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'week',  label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year',  label: '今年' },
] as const;

const SOURCE_OPTIONS = [
  { key: '',        label: '全部格式' },
  { key: 'convert', label: 'SVG（图片转）' },
  { key: 'upscale', label: 'PNG（AI 放大）' },
] as const;

const PAGE_SIZE_OPTIONS = [12, 24, 48];

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function pushHistory(q: string): string[] {
  if (typeof window === 'undefined') return [];
  const trimmed = q.trim();
  if (!trimmed) return loadHistory();
  const current = loadHistory().filter((x) => x !== trimmed);
  const next = [trimmed, ...current].slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function removeHistoryItem(q: string): string[] {
  if (typeof window === 'undefined') return [];
  const next = loadHistory().filter((x) => x !== q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center text-white/40">
          <Loader2 className="w-6 h-6 animate-spin" />
        </main>
      </>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [tab, setTab] = useState<TabKey>('posts');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [allTags, setAllTags] = useState<PostTag[]>([]);
  const [includeTagIds, setIncludeTagIds] = useState<number[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<number[]>([]);
  const [range, setRange] = useState<string>('all');
  const [source, setSource] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [postPage, setPostPage] = useState(1);
  const [postSize, setPostSize] = useState(12);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [tags, setTags] = useState<PostTag[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setHistory(loadHistory());
    listAllTags().then(setAllTags).catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
    setPostPage(1);
  }, [searchParams]);

  // 判断是否有任何筛选（用于决定是否执行搜索）
  const hasAnyFilter =
    query.trim().length > 0 ||
    includeTagIds.length > 0 ||
    excludeTagIds.length > 0 ||
    range !== 'all' ||
    source !== '';

  useEffect(() => {
    if (!hasAnyFilter) {
      setPosts([]); setUsers([]); setTags([]);
      setPostTotal(0); setUserTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      searchPosts(query, { includeTagIds, excludeTagIds, range, source, page: postPage, size: postSize }),
      searchUsers(query || includeTagIds.join(' ') || 'a', 1, 20),
      searchTags(query || includeTagIds.join(' ') || 'a', 30),
    ])
      .then(([p, u, t]) => {
        if (cancelled) return;
        setPosts(p.items);
        setPostTotal(p.total);
        setUsers(u.items);
        setUserTotal(u.total);
        setTags(t);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '搜索失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, includeTagIds, excludeTagIds, range, source, postPage, postSize, hasAnyFilter]);

  const handleSearch = (q?: string) => {
    const kw = (q ?? inputValue).trim();
    setShowHistory(false);
    if (kw) setHistory(pushHistory(kw));
    setPostPage(1);
    router.push(`/community/search?q=${encodeURIComponent(kw)}`);
  };

  const handleClearHistory = () => {
    if (!confirm('确认清空所有搜索历史？')) return;
    clearHistory();
    setHistory([]);
  };

  const handleRemoveHistory = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(removeHistoryItem(q));
  };

  const toggleInclude = (id: number) => {
    setIncludeTagIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!prev.includes(id)) setExcludeTagIds((ex) => ex.filter((x) => x !== id));
      setPostPage(1);
      return next;
    });
  };

  const toggleExclude = (id: number) => {
    setExcludeTagIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!prev.includes(id)) setIncludeTagIds((inc) => inc.filter((x) => x !== id));
      setPostPage(1);
      return next;
    });
  };

  const clearAdvanced = () => {
    setIncludeTagIds([]);
    setExcludeTagIds([]);
    setRange('all');
    setSource('');
    setPostPage(1);
  };

  const hasAdvancedFilter =
    includeTagIds.length > 0 || excludeTagIds.length > 0 ||
    range !== 'all' || source !== '';

  const totalPages = Math.max(1, Math.ceil(postTotal / postSize));

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50 mb-5">
            <Link href="/community" className="hover:text-white transition-colors">社区</Link>
            <span>/</span>
            <span className="text-[#f2f2f2]/80">搜索</span>
          </div>

          {/* 标题 */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold">搜索作品</h1>
          </div>

          {/* 搜索框 */}
          <div className="relative mb-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-[#f9cf00]/50 transition-colors">
              <SearchIcon className="w-5 h-5 text-white/40 shrink-0" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                placeholder="输入关键词，点击按钮或回车搜索"
                className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-base"
              />
              <button
                onClick={() => handleSearch()}
                className="px-4 py-1.5 rounded-lg bg-[#f9cf00] text-black text-sm font-medium hover:bg-[#e6bf00] transition-colors"
              >
                搜索
              </button>
            </div>

            {showHistory && history.length > 0 && !query && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="flex items-center gap-2 text-xs text-white/60">
                    <History className="w-3.5 h-3.5" /> 搜索历史
                  </span>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> 清除全部历史
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {history.map((q) => (
                    <div
                      key={q}
                      onClick={() => handleSearch(q)}
                      className="group flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <History className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-sm text-white/80 truncate">{q}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(q, e)}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 高级搜索开关 */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                showAdvanced || hasAdvancedFilter
                  ? 'bg-[#f9cf00]/10 border-[#f9cf00]/40 text-[#f9cf00]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              高级搜索
              {hasAdvancedFilter && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f9cf00] text-black text-[10px] font-bold">
                  {includeTagIds.length + excludeTagIds.length + (range !== 'all' ? 1 : 0) + (source ? 1 : 0)}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-4 glass-card p-5 space-y-5">
                {/* 发布时间 */}
                <div>
                  <label className="text-xs text-[#f2f2f2]/60 mb-2 block">发布时间</label>
                  <div className="flex flex-wrap gap-2">
                    {RANGE_OPTIONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => { setRange(r.key); setPostPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          range === r.key
                            ? 'bg-[#f9cf00] text-black'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 作品格式 */}
                <div>
                  <label className="text-xs text-[#f2f2f2]/60 mb-2 block">作品格式</label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => { setSource(s.key); setPostPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          source === s.key
                            ? 'bg-[#f9cf00] text-black'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 包含标签 */}
                <div>
                  <label className="text-xs text-[#f2f2f2]/60 mb-2 block">包含标签</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t) => {
                      const active = includeTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleInclude(t.id)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            active
                              ? 'bg-[#f9cf00] text-black font-medium'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          #{t.name} ({t.usageCount})
                        </button>
                      );
                    })}
                    {allTags.length === 0 && (
                      <span className="text-xs text-white/40">暂无可选标签</span>
                    )}
                  </div>
                </div>

                {/* 排除标签 */}
                <div>
                  <label className="text-xs text-[#f2f2f2]/60 mb-2 block">排除标签</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((t) => {
                      const active = excludeTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleExclude(t.id)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            active
                              ? 'bg-red-500 text-white font-medium'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasAdvancedFilter && (
                  <div className="flex justify-end">
                    <button
                      onClick={clearAdvanced}
                      className="text-xs text-red-400/80 hover:text-red-400 transition-colors"
                    >
                      清除高级筛选
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          {hasAnyFilter && (
            <div className="flex items-center gap-1 mb-6 border-b border-white/5">
              {TABS.map((t) => {
                const count = t.key === 'posts' ? postTotal : t.key === 'users' ? userTotal : tags.length;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                      active ? 'text-[#f9cf00]' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs text-white/40">{count}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f9cf00]" />
                    )}
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

          {loading && (
            <div className="flex items-center justify-center py-20 text-[#f2f2f2]/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> 搜索中...
            </div>
          )}

          {!loading && !hasAnyFilter && (
            <div className="glass-card p-16 text-center text-[#f2f2f2]/50">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
              <p>输入关键词或选择筛选条件开始搜索</p>
            </div>
          )}

          {!loading && hasAnyFilter && (
            <>
              {tab === 'posts' && (
                <>
                  {postTotal === 0 ? (
                    <EmptyHint text="没有找到符合条件的作品" />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {posts.map((p) => <PostCard key={p.id} post={p} />)}
                      </div>

                      {/* 分页器 + 每页选择（居中） */}
                      <div className="mt-10 flex flex-col items-center gap-4">
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                              disabled={postPage <= 1}
                              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {generatePageNumbers(postPage, totalPages).map((p, i) =>
                              p === '...' ? (
                                <span key={`e-${i}`} className="px-2 text-[#f2f2f2]/40">...</span>
                              ) : (
                                <button
                                  key={p}
                                  onClick={() => setPostPage(p as number)}
                                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm transition-colors ${
                                    p === postPage
                                      ? 'bg-[#f9cf00] text-black font-semibold'
                                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                  }`}
                                >
                                  {p}
                                </button>
                              )
                            )}

                            <button
                              onClick={() => setPostPage((p) => Math.min(totalPages, p + 1))}
                              disabled={postPage >= totalPages}
                              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-[#f2f2f2]/60">
                          <span>每页显示</span>
                          <select
                            value={postSize}
                            onChange={(e) => { setPostSize(Number(e.target.value)); setPostPage(1); }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#f2f2f2] text-sm outline-none focus:border-[#f9cf00] transition-colors"
                          >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                              <option key={n} value={n} className="bg-[#15161a]">{n}</option>
                            ))}
                          </select>
                          <span>条</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {tab === 'users' && (
                userTotal === 0 ? (
                  <EmptyHint text="没有找到相关用户" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u) => <UserCard key={u.id} user={u} />)}
                  </div>
                )
              )}

              {tab === 'tags' && (
                tags.length === 0 ? (
                  <EmptyHint text="没有找到相关标签" />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {tags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/community/posts?tagId=${t.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#f9cf00]/50 text-white/80 hover:text-white transition-all"
                      >
                        <Hash className="w-4 h-4" />
                        {t.name}
                        <span className="text-xs text-white/40">{t.usageCount}</span>
                      </Link>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="glass-card p-16 text-center text-[#f2f2f2]/50">
      <ImageOff className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
      <p>{text}</p>
    </div>
  );
}

function PostCard({ post }: { post: PostItem }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';
  return (
    <Link
      href={`/community/post/${post.id}`}
      className="group glass-card overflow-hidden hover:border-[#f9cf00]/40 transition-all"
    >
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        {cover ? (
          <img src={cover} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium truncate mb-2 text-sm group-hover:text-[#f9cf00] transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likeCount}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}</span>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.viewCount}</span>
        </div>
      </div>
    </Link>
  );
}

function UserCard({ user }: { user: UserBrief }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="glass-card p-5 flex items-center gap-4 hover:border-[#f9cf00]/40 transition-all"
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-lg font-bold overflow-hidden shrink-0">
        {user.avatarUrl ? (
          <img src={assetUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
        ) : (
          (user.username?.[0] || '?').toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.username}</p>
        {user.bio && <p className="text-xs text-white/50 truncate mt-1">{user.bio}</p>}
      </div>
      <UserIcon className="w-4 h-4 text-white/30" />
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