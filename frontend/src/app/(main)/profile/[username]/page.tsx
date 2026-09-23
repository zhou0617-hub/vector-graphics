'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { getUserByUsername } from '@/lib/api/users';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/api';
import { Pencil, Image as ImageIcon } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const currentUser = useAuthStore((s) => s.user);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isMe = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username)
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          加载中...
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
      <main className="min-h-screen relative">
        <div className="h-48 md:h-64 relative bg-gradient-to-b from-[#1a1c20] to-black">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f9cf00]/5 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="-mt-20 flex flex-col items-center mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-5xl font-bold overflow-hidden border-4 border-black">
              {user.avatarUrl ? (
                <img
                  src={assetUrl(user.avatarUrl)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username[0].toUpperCase()
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mt-6">{user.username}</h1>

            {user.bio && (
              <p className="text-sm text-[#f2f2f2]/60 mt-3 max-w-xl text-center">
                {user.bio}
              </p>
            )}

            <div className="flex items-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-[#f2f2f2]/50 mt-1">粉丝</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-[#f2f2f2]/50 mt-1">关注</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-[#f2f2f2]/50 mt-1">获赞</div>
              </div>
            </div>

            {isMe && (
              <div className="flex items-center gap-3 mt-8">
                <Link href="/settings" className="btn-secondary">
                  <Pencil className="w-4 h-4" /> 编辑资料
                </Link>
              </div>
            )}
          </div>

          <div className="mt-16 mb-20">
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon className="w-5 h-5 text-[#f2f2f2]/60" />
              <h2 className="text-lg font-semibold">公开资产</h2>
            </div>

            <div className="glass-card p-16 text-center">
              <p className="text-[#f2f2f2]/40">暂无公开作品</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
