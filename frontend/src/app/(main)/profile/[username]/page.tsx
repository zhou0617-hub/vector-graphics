'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { getUserByUsername } from '@/lib/api/users';
import { assetUrl, request } from '@/lib/api/client';
import { getUserStats } from '@/lib/api/community';
import { useAuthStore } from '@/stores/auth-store';
import type { User, PostItem, UserCommentResponse, PageResponse, UserStats } from '@/types/api';
import {
  Pencil, Image as ImageIcon, Heart, Star, MessageCircle,
  Loader2, ImageOff, Eye, LayoutGrid, Activity,
  Calendar, Link2, Sparkles,
} from 'lucide-react';

const MAIN_TABS = [
  { key: 'posts',    label: '公开作品', icon: LayoutGrid },
  { key: 'activity', label: '动态',     icon: Activity },
] as const;

type MainTabKey = typeof MAIN_TABS[number]['key'];

const ACTIVITY_TABS = [
  { key: 'liked',     label: '点赞',  icon: Heart },
  { key: 'favorited', label: '收藏',  icon: Star },
  { key: 'comments',  label: '评论',  icon: MessageCircle },
] as const;

type ActivityTabKey = typeof ACTIVITY_TABS[number]['key'];

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const currentUser = useAuthStore((s) => s.user);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainTab, setMainTab] = useState<MainTabKey>('posts');
  const [activityTab, setActivityTab] = useState<ActivityTabKey>('liked');

  // 实时统计
  const [stats, setStats] = useState<UserStats>({
    postCount: 0, likedCount: 0, favoritedCount: 0, commentCount: 0,
  });

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [liked, setLiked] = useState<PostItem[]>([]);
  const [favorited, setFavorited] = useState<PostItem[]>([]);
  const [comments, setComments] = useState<UserCommentResponse[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const isMe = currentUser?.username === username;

  // 加载用户信息
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username)
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [username]);

  // 加载统计（依赖 user.id，每次进入页面或切换用户时触发）
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserStats(user.id)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // 加载 Tab 内容
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTabLoading(true);

    const base = `/api/community/posts/user/${user.id}`;
    let promise: Promise<unknown>;

    if (mainTab === 'posts') {
      promise = request<PageResponse<PostItem>>(`${base}?page=1&size=60`).then((r) => {
        if (!cancelled) setPosts(r.items);
      });
    } else {
      switch (activityTab) {
        case 'liked':
          promise = request<PageResponse<PostItem>>(`${base}/liked?page=1&size=60`).then((r) => {
            if (!cancelled) setLiked(r.items);
          });
          break;
        case 'favorited':
          promise = request<PageResponse<PostItem>>(`${base}/favorited?page=1&size=60`).then((r) => {
            if (!cancelled) setFavorited(r.items);
          });
          break;
        case 'comments':
          promise = request<PageResponse<UserCommentResponse>>(`${base}/comments?page=1&size=60`).then((r) => {
            if (!cancelled) setComments(r.items);
          });
          break;
        default:
          promise = Promise.resolve();
      }
    }

    promise.catch(() => {}).finally(() => {
      if (!cancelled) setTabLoading(false);
    });

    return () => { cancelled = true; };
  }, [user, mainTab, activityTab]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          {error || '用户不存在'}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen relative pt-12 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">首页</Link>
            <span>/</span>
            <span className="text-[#f2f2f2]/80">{user.username} 的主页</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* ==================== 左侧：个人信息 ==================== */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="glass-card p-6 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-5xl font-bold overflow-hidden border-4 border-[#f9cf00]/20">
                  {user.avatarUrl ? (
                    <img src={assetUrl(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>

                <h1 className="text-xl font-bold mt-4">{user.username}</h1>

                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-[#f9cf00]/10 border border-[#f9cf00]/20 text-[#f9cf00] text-xs">
                  <Sparkles className="w-3 h-3" />
                  {user.role === 'admin' ? '管理员' : '创作者'}
                </span>

                {user.bio && (
                  <p className="text-sm text-[#f2f2f2]/60 mt-3 leading-relaxed max-w-[240px]">
                    {user.bio}
                  </p>
                )}

                <div className="w-full mt-5 pt-5 border-t border-white/5 space-y-2.5 text-left">
                  <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">@{user.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      加入于 {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('zh-CN')
                        : '未知'}
                    </span>
                  </div>
                </div>

                {isMe && (
                  <Link
                    href="/settings"
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> 编辑资料
                  </Link>
                )}

                {isMe && (
                  <Link
                    href="/community/publish"
                    className="mt-2.5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f9cf00] text-black font-medium text-sm hover:bg-[#e6bf00] transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" /> 发布新作品
                  </Link>
                )}
              </div>
            </aside>

            {/* ==================== 右侧：内容区 ==================== */}
            <section className="min-w-0">
              {/* 4 个实时统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                  icon={LayoutGrid}
                  value={stats.postCount}
                  label="公开作品"
                  color="text-[#f9cf00]"
                  bg="bg-[#f9cf00]/10"
                />
                <StatCard
                  icon={Heart}
                  value={stats.likedCount}
                  label="点赞"
                  color="text-red-400"
                  bg="bg-red-500/10"
                />
                <StatCard
                  icon={Star}
                  value={stats.favoritedCount}
                  label="收藏"
                  color="text-[#f9cf00]"
                  bg="bg-[#f9cf00]/10"
                />
                <StatCard
                  icon={MessageCircle}
                  value={stats.commentCount}
                  label="评论"
                  color="text-blue-400"
                  bg="bg-blue-500/10"
                />
              </div>

              {/* 顶级 Tab */}
              <div className="glass-card mb-6 flex items-center px-2">
                {MAIN_TABS.map((t) => {
                  const Icon = t.icon;
                  const active = mainTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setMainTab(t.key)}
                      className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-4 text-sm font-medium transition-colors ${
                        active ? 'text-[#f9cf00]' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                      {active && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#f9cf00] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {mainTab === 'activity' && (
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {ACTIVITY_TABS.map((t) => {
                    const Icon = t.icon;
                    const active = activityTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setActivityTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${
                          active
                            ? 'bg-[#f9cf00] text-black font-medium'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {tabLoading && (
                <div className="text-center py-16 text-[#f2f2f2]/40">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> 加载中...
                </div>
              )}

              {!tabLoading && mainTab === 'posts' && (
                <PostGrid posts={posts} emptyText="暂无公开作品" />
              )}

              {!tabLoading && mainTab === 'activity' && activityTab === 'liked' && (
                <PostGrid posts={liked} emptyText="还没有点赞过任何作品" />
              )}

              {!tabLoading && mainTab === 'activity' && activityTab === 'favorited' && (
                <PostGrid posts={favorited} emptyText="还没有收藏过任何作品" />
              )}

              {!tabLoading && mainTab === 'activity' && activityTab === 'comments' && (
                <CommentList comments={comments} />
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon: Icon, value, label, color, bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-[#f2f2f2]/50 truncate">{label}</div>
      </div>
    </div>
  );
}

function PostGrid({ posts, emptyText }: { posts: PostItem[]; emptyText: string }) {
  if (posts.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <ImageOff className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
        <p className="text-[#f2f2f2]/50 text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {posts.map((p) => (
        <Link
          key={p.id}
          href={`/community/post/${p.id}`}
          className="group glass-card overflow-hidden hover:border-[#f9cf00]/40 transition-all"
        >
          <div className="aspect-square bg-white/5 overflow-hidden">
            {p.coverUrl ? (
              <img src={assetUrl(p.coverUrl)} alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/20">
                <ImageOff className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate mb-1.5 group-hover:text-[#f9cf00] transition-colors">{p.title}</p>
            <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likeCount}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.viewCount}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CommentList({ comments }: { comments: UserCommentResponse[] }) {
  if (comments.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
        <p className="text-[#f2f2f2]/50 text-sm">还没有发表过评论</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="glass-card p-4 flex gap-4">
          <Link href={`/community/post/${c.postId}`}
            className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden shrink-0">
            {c.postCover ? (
              <img src={assetUrl(c.postCover)} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/20">
                <ImageOff className="w-5 h-5" />
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/community/post/${c.postId}`}
              className="text-xs text-[#f9cf00]/80 hover:text-[#f9cf00] transition-colors truncate block mb-1">
              在《{c.postTitle || '未知作品'}》中评论
              {c.commentCount > 1 && (
                <span className="ml-1 text-white/40">（共 {c.commentCount} 条）</span>
              )}
              ：
            </Link>
            <p className="text-sm text-[#f2f2f2]/80 whitespace-pre-wrap break-words">{c.content}</p>
            <p className="text-xs text-[#f2f2f2]/40 mt-2">
              {new Date(c.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}