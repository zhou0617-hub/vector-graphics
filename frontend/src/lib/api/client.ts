const BASE_URL =
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
    window.location.href = `/login?redirect=${redirect}`;
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
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
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
  return `${BASE_URL}${p}`;
}

export const API_BASE_URL = BASE_URL;
