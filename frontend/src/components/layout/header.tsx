'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { assetUrl } from '@/lib/api/client';
import { Sparkles, User, LogOut, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/tools/image-to-svg', label: '图片转 SVG' },
  { href: '/my/files', label: '我的文件' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 左侧：Logo + 导航卡片 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold shrink-0 text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="hidden sm:inline">Vector Graphics</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-white/90 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {/* 选中指示条 */}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#f9cf00]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 右侧：用户区 */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-1.5 py-1.5 pr-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-xs font-bold overflow-hidden">
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
                <span className="text-white/90 max-w-[100px] truncate">{user.username}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden">
                  <div className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black font-bold text-lg overflow-hidden">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-white">{user.username}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人主页
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full text-white/90 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link href="/register" className="btn-primary">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
