'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register as apiRegister } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRegister(email, password, username);
      setAuth(res.token, res.user);
      router.push('/tools/image-to-svg');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#f9cf00]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-semibold">Vector Graphics</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold mb-2">创建账号</h1>
          <p className="text-sm text-[#f2f2f2]/50 mb-6">免费注册，开始创作</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={32}
                placeholder="3-32 位字母或数字"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="至少 6 位"
                className="input-dark"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#f2f2f2]/50 text-center">
            已有账号？{' '}
            <Link href="/login" className="text-[#f9cf00] hover:underline">
              去登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
