#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FE = process.cwd();
const files = {};

// ==================== RequireAuth 守卫组件 ====================
files['src/components/require-auth.tsx'] = `'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/lib/api/auth';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

/**
 * 登录守卫
 *
 * 规则：
 * 1. 无 token → 跳转登录页
 * 2. 有 token 但无 user（例如 HMR 后）→ 调用 /api/users/me 获取用户信息
 * 3. token 失效（接口返回 401）→ 清除本地状态并跳转登录页
 * 4. 验证中 → 显示加载中，不渲染子内容
 */
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 无 token，直接跳登录
    if (!token) {
      setChecking(false);
      router.replace(\`/login?redirect=\${encodeURIComponent(pathname)}\`);
      return;
    }

    // 有 token 但无 user，验证并拉取用户信息
    if (!user) {
      getMe()
        .then((u) => {
          setUser(u);
          setChecking(false);
        })
        .catch(() => {
          // token 失效
          logout();
          router.replace(\`/login?redirect=\${encodeURIComponent(pathname)}\`);
        });
      return;
    }

    // 都正常
    setChecking(false);
  }, [token, user, router, pathname, setUser, logout]);

  if (checking || !token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          验证登录状态...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

// ==================== (main) 布局：包裹所有需要登录的页面 ====================
files['src/app/(main)/layout.tsx'] = `import { RequireAuth } from '@/components/require-auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
`;

// ==================== 登录页：支持 redirect 参数 ====================
files['src/app/(auth)/login/page.tsx'] = `'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login as apiLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/tools/image-to-svg';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setAuth(res.token, res.user);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
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
          <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
          <p className="text-sm text-[#f2f2f2]/50 mb-6">登录以继续使用</p>

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
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-dark"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#f2f2f2]/50 text-center">
            还没有账号？{' '}
            <Link href="/register" className="text-[#f9cf00] hover:underline">
              去注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
`;

// ==================== auth-store（加固：HMR 后从 localStorage 恢复 token） ====================
files['src/stores/auth-store.ts'] = `import { create } from 'zustand';
import type { User } from '@/types/api';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ token, user });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ token: null, user: null });
  },

  // 从 localStorage 恢复 token（仅在客户端初始化时调用一次）
  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    set({ token: token || null, hydrated: true });
  },
}));
`;

// ==================== Providers（启动时 hydrate） ====================
files['src/components/providers.tsx'] = `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const hydrate = useAuthStore((s) => s.hydrate);

  // 应用启动时，从 localStorage 恢复 token
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;

let count = 0;
for (const relPath of Object.keys(files)) {
  const full = path.join(FE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, files[relPath], 'utf8');
  console.log('  [文件] ' + relPath);
  count++;
}
console.log('');
console.log('完成：创建/覆盖 ' + count + ' 个文件。');
