'use client';

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
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
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
