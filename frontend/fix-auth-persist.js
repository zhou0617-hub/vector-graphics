#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FE = process.cwd();
const files = {};

// ==================== auth-store.ts ====================
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

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }
    set({ token: token || null, user, hydrated: true });
  },
}));
`;

// ==================== RequireAuth ====================
files['src/components/require-auth.tsx'] = `'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    // 等 hydrate 完成后再判断，避免 SSR 和客户端首帧不一致
    if (!hydrated) return;

    if (!token) {
      router.replace(\`/login?redirect=\${encodeURIComponent(pathname)}\`);
    }
  }, [hydrated, token, router, pathname]);

  // hydrate 未完成，或未登录，都显示 loading，不渲染子内容
  if (!hydrated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

// ==================== client.ts（加 401 拦截） ====================
files['src/lib/api/client.ts'] = `const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // 避免在登录页/注册页死循环
  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register') {
    const redirect = encodeURIComponent(path + window.location.search);
    window.location.href = \`/login?redirect=\${redirect}\`;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }

  const res = await fetch(\`\${BASE_URL}\${path}\`, { ...options, headers });
  const json = await res.json();

  // 401：token 失效，清除本地状态并跳登录
  if (json.code === 401) {
    clearAuthAndRedirect();
    throw new ApiError(401, json.message || '登录已过期');
  }

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message || '请求失败');
  }
  return json.data as T;
}

export function assetUrl(p: string | null | undefined): string {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  return \`\${BASE_URL}\${p}\`;
}

export const API_BASE_URL = BASE_URL;
`;

// ==================== Providers（保持 hydrate 调用） ====================
files['src/components/providers.tsx'] = `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const hydrate = useAuthStore((s) => s.hydrate);

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
