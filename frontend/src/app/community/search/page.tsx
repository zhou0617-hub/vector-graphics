'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { searchPosts, searchUsers, searchTags } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { PostItem, PostTag, UserBrief } from '@/types/api';
import {
  Search as SearchIcon, Loader2, Heart, MessageCircle,
  Eye, ImageOff, Hash, User as UserIcon,
} from 'lucide-react';

const TABS = [
  { key: 'posts', label: '作品' },
  { key: 'users', label: '用户' },
  { key: 'tags',  label: '标签' },
] as const;

type TabKey = typeof TABS[number]['key'];

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

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [tags, setTags] = useState<PostTag[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL 参数变化时同步
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
  }, [searchParams]);

  // 加载三类结果
  useEffect(() => {
    if (!query.trim()) {
      setPosts([]); setUsers([]); setTags([]);
      setPostTotal(0); setUserTotal(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      searchPosts(query, 1, 40),
      searchUsers(query, 1, 20),
      searchTags(query, 30),
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
  }, [query]);

  const handleSearch = () => {
    const q = inputValue.trim();
    if (!q) return;
    router.push(`/community/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">搜索社区</h1>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-[#f9cf00]/50 transition-colors">
              <SearchIcon className="w-5 h-5 text-white/40" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="搜索作品、用户、标签..."
                className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-base"
              />
              <button
                onClick={handleSearch}
                disabled={!inputValue.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#f9cf00] text-black text-sm font-medium hover:bg-[#e6bf00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                搜索
              </button>
            </div>
          </div>

          {query && (
            <div className="flex items-center gap-2 mb-6 border-b border-white/5">
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

          {!loading && !query && (
            <div className="glass-card p-16 text-center text-[#f2f2f2]/50">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
              <p>输入关键词开始搜索</p>
            </div>
          )}

          {!loading && query && (
            <>
              {tab === 'posts' && (
                posts.length === 0 ? <EmptyHint text={`没有找到与「${query}」相关的作品`} /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {posts.map((p) => <PostCard key={p.id} post={p} />)}
                  </div>
                )
              )}

              {tab === 'users' && (
                users.length === 0 ? <EmptyHint text={`没有找到与「${query}」相关的用户`} /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u) => <UserCard key={u.id} user={u} />)}
                  </div>
                )
              )}

              {tab === 'tags' && (
                tags.length === 0 ? <EmptyHint text={`没有找到与「${query}」相关的标签`} /> : (
                  <div className="flex flex-wrap gap-3">
                    {tags.map((t) => (
                      <Link
                        key={t.id}
                        href={`/community?tagId=${t.id}`}
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
    <Link href={`/community/post/${post.id}`} className="glass-card overflow-hidden group hover:border-[#f9cf00]/40 transition-all">
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        {cover ? (
          <img src={cover} alt={post.title} className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium truncate mb-2 text-sm">{post.title}</p>
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
    <Link href={`/profile/${user.username}`} className="glass-card p-5 flex items-center gap-4 hover:border-[#f9cf00]/40 transition-all">
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