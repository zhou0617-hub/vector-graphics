'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { getRanking } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { PostItem } from '@/types/api';
import {
  Loader2, ArrowLeft, Flame, Heart, MessageCircle,
  Eye, Trophy, Medal, Crown, ImageOff,
} from 'lucide-react';

const PERIODS = [
  { key: 'day',   label: '日榜' },
  { key: 'week',  label: '周榜' },
  { key: 'month', label: '月榜' },
  { key: 'year',  label: '年榜' },
  { key: 'all',   label: '总榜' },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

export default function RankingPage() {
  const [period, setPeriod] = useState<PeriodKey>('day');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getRanking(period, 50)
      .then((res) => {
        if (!cancelled) setPosts(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period]);

  // 前三名单独展示，其余按列表展示
  const top3 = posts.slice(0, 3);
  const rest = posts.slice(3);

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
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
              <Flame className="w-8 h-8 text-[#f9cf00]" />
              热度排行
            </h1>
            <p className="text-sm text-[#f2f2f2]/50">
              热度 = 点赞 × 3 + 收藏 × 5 + 评论 × 4
            </p>
          </div>

          {/* 时间维度切换 */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#f9cf00] text-black'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {/* 加载中 */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-[#f2f2f2]/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          )}

          {/* 空状态 */}
          {!loading && posts.length === 0 && (
            <div className="glass-card p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-[#f2f2f2]/40" />
              </div>
              <p className="text-[#f2f2f2]/60">此时间段暂无上榜作品</p>
            </div>
          )}

          {/* 前三名 */}
          {!loading && top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {top3.map((post, i) => (
                <TopCard key={post.id} post={post} rank={i + 1} />
              ))}
            </div>
          )}

          {/* 4 名及以后 */}
          {!loading && rest.length > 0 && (
            <div className="glass-card overflow-hidden">
              {rest.map((post, i) => (
                <RankRow key={post.id} post={post} rank={i + 4} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/** 前三名卡片 */
function TopCard({ post, rank }: { post: PostItem; rank: number }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';

  const rankStyle = {
    1: {
      bg: 'from-[#f9cf00]/20 to-[#f9cf00]/5',
      border: 'border-[#f9cf00]/50',
      badge: 'bg-gradient-to-br from-[#f9cf00] to-[#e6bf00] text-black',
      icon: Crown,
      label: '冠军',
    },
    2: {
      bg: 'from-gray-300/20 to-gray-300/5',
      border: 'border-gray-400/50',
      badge: 'bg-gradient-to-br from-gray-300 to-gray-500 text-black',
      icon: Medal,
      label: '亚军',
    },
    3: {
      bg: 'from-amber-700/20 to-amber-700/5',
      border: 'border-amber-700/50',
      badge: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
      icon: Medal,
      label: '季军',
    },
  }[rank as 1 | 2 | 3];

  const Icon = rankStyle.icon;

  return (
    <Link
      href={`/community/post/${post.id}`}
      className={`glass-card relative overflow-hidden bg-gradient-to-b ${rankStyle.bg} border ${rankStyle.border} group transition-all hover:scale-[1.02]`}
    >
      {/* 排名徽章 */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <div className={`w-9 h-9 rounded-full ${rankStyle.badge} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
          {rankStyle.label}
        </span>
      </div>

      {/* 封面 */}
      <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/30">
            <ImageOff className="w-12 h-12" />
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="font-semibold truncate mb-3" title={post.title}>
          {post.title}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-[10px] font-bold overflow-hidden shrink-0">
            {post.userAvatar ? (
              <img src={assetUrl(post.userAvatar)} alt="" className="w-full h-full object-cover" />
            ) : (
              (post.username?.[0] || '?').toUpperCase()
            )}
          </div>
          <span className="text-xs text-[#f2f2f2]/60 truncate">{post.username || '匿名'}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#f2f2f2]/60">
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

/** 4 名及以后的行 */
function RankRow({ post, rank }: { post: PostItem; rank: number }) {
  const cover = post.coverUrl ? assetUrl(post.coverUrl) : '';

  return (
    <Link
      href={`/community/post/${post.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
    >
      {/* 排名 */}
      <div className="w-10 text-center shrink-0">
        <span className="text-lg font-bold text-[#f2f2f2]/40">{rank}</span>
      </div>

      {/* 缩略图 */}
      <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden shrink-0">
        {cover ? (
          <img src={cover} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/30">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* 标题 + 作者 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate mb-1" title={post.title}>{post.title}</p>
        <p className="text-xs text-[#f2f2f2]/50 truncate">
          作者：{post.username || '匿名'}
        </p>
      </div>

      {/* 统计 */}
      <div className="flex items-center gap-4 text-xs text-[#f2f2f2]/60 shrink-0">
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
    </Link>
  );
}