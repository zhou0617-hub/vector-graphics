'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { listPosts, getRandomPostId } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { PostItem, PageResponse } from '@/types/api';
import {
  Heart, MessageCircle, Eye, Loader2, Plus,
  ImageOff, Flame, Sparkles, Search as SearchIcon,
  Hash, LayoutGrid, ChevronRight, Dices,
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [randomLoading, setRandomLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listPosts({ sort: 'latest', page: 1, size: 8 })
      .then((res: PageResponse<PostItem>) => {
        if (!cancelled) setPosts(res.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleRandom = async () => {
    if (randomLoading) return;
    setRandomLoading(true);
    try {
      const id = await getRandomPostId();
      if (id == null) {
        alert('社区还没有作品哦');
        return;
      }
      router.push(`/community/post/${id}`);
    } catch {
      alert('获取随机作品失败');
    } finally {
      setRandomLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* ==================== 顶部 Banner 区域（左右两列）==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* 左列：欢迎卡 + 三个大按钮 */}
            <div className="flex flex-col gap-5">
              {/* 欢迎卡片 */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1c20] via-[#15161a] to-black border border-white/5 p-8 md:p-10 flex-1">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f9cf00]/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9cf00]/10 border border-[#f9cf00]/20 text-[#f9cf00] text-xs mb-5">
                    <Sparkles className="w-3 h-3" />
                    欢迎来到 Vector Graphics
                  </span>

                  <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                    一站式 <span className="text-[#f9cf00]">SVG 矢量</span> 创作社区！
                  </h1>

                  <p className="text-[#f2f2f2]/60 mb-7 max-w-md">
                    免费、高质量的图片转 SVG 平台。上传、转换、放大、分享，与创作者们一起玩转矢量。
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href="/community/publish"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f9cf00] text-black font-medium text-sm hover:bg-[#e6bf00] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      发布作品
                    </Link>

                    <button
                      onClick={handleRandom}
                      disabled={randomLoading}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      title="随机一部作品"
                    >
                      {randomLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Dices className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 三个大按钮（铺满左列宽度） */}
              <div className="grid grid-cols-3 gap-4">
                <Link
                  href="/community/tags"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl bg-[#f9cf00]/8 border border-[#f9cf00]/20 hover:bg-[#f9cf00]/15 transition-all group"
                >
                  <Hash className="w-5 h-5 text-[#f9cf00]" />
                  <span className="text-sm font-medium text-white group-hover:text-[#f9cf00] transition-colors">
                    标签
                  </span>
                </Link>

                <Link
                  href="/community/search"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <SearchIcon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    搜索
                  </span>
                </Link>

                <Link
                  href="/community/posts"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <LayoutGrid className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    公开作品
                  </span>
                </Link>
              </div>
            </div>

            {/* 右列：公告卡片 */}
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1c20] to-black p-8 md:p-10">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,rgba(249,207,0,0.15),transparent_60%)] pointer-events-none" />

              <div className="relative h-full flex flex-col justify-end">
                <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f9cf00] animate-pulse" />
                  公告
                </div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-white">
                  平台公告与更新日志
                </h2>
                <p className="text-sm text-[#f2f2f2]/60 leading-relaxed">
                  新功能上线：社区模块全面开放，支持作品发布、点赞、收藏、评论、标签筛选和热度排行。
                  欢迎体验并反馈问题。
                </p>
              </div>
            </div>
          </div>

          {/* ==================== 最新作品 ==================== */}
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#f9cf00]" />
              最新作品
            </h2>
            <Link
              href="/community/posts"
              className="flex items-center gap-1 text-sm text-[#f2f2f2]/60 hover:text-[#f9cf00] transition-colors group"
            >
              查看更多
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
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
              <p className="text-[#f2f2f2]/60 mb-4">还没有作品，来发布第一个吧</p>
              <Link href="/community/publish" className="btn-primary">
                <Plus className="w-4 h-4" /> 发布作品
              </Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/** 作品卡片 */
function PostCard({ post }: { post: PostItem }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';
  return (
    <Link
      href={`/community/post/${post.id}`}
      className="glass-card overflow-hidden transition-all hover:border-[#f9cf00]/40 hover:shadow-lg hover:shadow-[#f9cf00]/5"
    >
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
            loading="lazy"
          />
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
  );
}