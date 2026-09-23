#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FE = process.cwd();
const files = {};

// ==================== globals.css（删除光点） ====================
files['src/app/globals.css'] = `@import "tailwindcss";

:root {
  --background: #000000;
  --foreground: #f2f2f2;
  --card: #0c0d10;
  --card-elevated: #1b1d20;
  --border: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.18);
  --muted: #999999;
  --muted-foreground: #666666;
  --primary: #f9cf00;
  --primary-foreground: #000000;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
}

* {
  box-sizing: border-box;
  border-color: var(--border);
}

html, body {
  background: var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}

.glass-card {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 24px rgba(0, 0, 0, 0.4);
}

.glass-card-hover:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.18);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary);
  color: #000;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #ffdb33;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--foreground);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.22);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.input-dark {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: var(--foreground);
  font-size: 14px;
  transition: all 0.15s;
  outline: none;
}

.input-dark::placeholder {
  color: var(--muted-foreground);
}

.input-dark:focus {
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.06);
}
`;

// ==================== Header（头像用 assetUrl） ====================
files['src/components/layout/header.tsx'] = `'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { assetUrl } from '@/lib/api/client';
import { Sparkles, User, LogOut, ChevronDown } from 'lucide-react';

export function Header() {
  const router = useRouter();
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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span>Vector Graphics</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#f2f2f2]/70">
            <Link href="/tools/image-to-svg" className="hover:text-[#f9cf00] transition-colors">
              图片转 SVG
            </Link>
            <Link href="/my/files" className="hover:text-[#f9cf00] transition-colors">
              我的文件
            </Link>
          </nav>
        </div>

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
                <span className="text-[#f2f2f2]/80 max-w-[100px] truncate">{user.username}</span>
                <ChevronDown className={\`w-3.5 h-3.5 text-[#f2f2f2]/50 transition-transform \${menuOpen ? 'rotate-180' : ''}\`} />
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
                        <p className="font-medium truncate">{user.username}</p>
                        <p className="text-xs text-[#f2f2f2]/40 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href={\`/profile/\${user.username}\`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#f2f2f2]/80 hover:bg-white/5 hover:text-[#f2f2f2] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人主页
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#f2f2f2]/80 hover:bg-white/5 hover:text-[#f2f2f2] transition-colors"
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
                className="px-4 py-1.5 rounded-full text-[#f2f2f2]/80 hover:text-[#f2f2f2] transition-colors"
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
`;

// ==================== 设置页（头像用 assetUrl + glass-card） ====================
files['src/app/(main)/settings/page.tsx'] = `'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { AvatarCropper } from '@/components/avatar-cropper';
import { updateProfile, updateUsername, updatePassword, uploadAvatar } from '@/lib/api/users';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { X, Lock, Upload, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, setUser } = useAuthStore();
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setBio(currentUser.bio || '');
    setUsername(currentUser.username);
  }, [currentUser, router]);

  if (!currentUser) return null;

  const showMessage = (type: 'ok' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (username !== currentUser.username) {
        const updated = await updateUsername(username);
        setUser(updated);
      }
      const updated2 = await updateProfile({ bio });
      setUser(updated2);
      showMessage('ok', '保存成功');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showMessage('error', '请填写原密码和新密码');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      showMessage('ok', '密码修改成功');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('error', '请上传图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', '图片不能超过 10MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('error', '请上传图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', '图片不能超过 10MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setUploadingAvatar(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const updated = await uploadAvatar(file);
      setUser(updated);
      setCropSrc(null);
      showMessage('ok', '头像已更新');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">个人资料设置</h1>
            <button
              onClick={() => router.push(\`/profile/\${currentUser.username}\`)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-5">
              <div
                onDrop={handleAvatarDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-3xl font-bold overflow-hidden cursor-pointer group border-2 border-dashed border-white/20 hover:border-[#f9cf00] transition-all"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={assetUrl(currentUser.avatarUrl)}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.username[0].toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div>
                <p className="font-semibold text-lg">{currentUser.username}</p>
                <p className="text-xs text-[#f2f2f2]/40 mt-1">
                  点击头像或拖拽图片到此处
                </p>
                <p className="text-xs text-[#f2f2f2]/30 mt-0.5">
                  支持任意图片格式，最大 10MB，可裁剪
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-5">个人主页</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={32}
                    className="input-dark"
                  />
                  <p className="text-xs text-[#f2f2f2]/40 mt-1.5">
                    3-32 位字母、数字、下划线或中划线
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                    简介
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="介绍一下自己..."
                    rows={4}
                    maxLength={512}
                    className="input-dark resize-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="btn-primary w-full"
                >
                  {savingProfile ? '保存中...' : '保存资料'}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-semibold mb-5">账号与安全</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#f2f2f2]/80">
                    邮箱
                  </label>
                  <input
                    type="text"
                    value={currentUser.email}
                    disabled
                    className="input-dark opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-[#f2f2f2]/40 mt-1.5">邮箱暂不支持修改</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <label className="block text-sm font-medium mb-3 text-[#f2f2f2]/80">
                    修改密码
                  </label>
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="原密码"
                      className="input-dark"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="新密码（至少 6 位）"
                      className="input-dark"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="btn-secondary w-full"
                    >
                      <Lock className="w-4 h-4" />
                      {savingPassword ? '修改中...' : '修改密码'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={\`mt-6 px-4 py-3 rounded-lg text-sm \${
                message.type === 'ok'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }\`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => router.push(\`/profile/\${currentUser.username}\`)}
              className="btn-secondary"
            >
              返回
            </button>
          </div>
        </div>
      </main>

      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onConfirm={handleCropConfirm}
          uploading={uploadingAvatar}
        />
      )}
    </>
  );
}
`;

// ==================== 个人主页（头像用 assetUrl） ====================
files['src/app/(main)/profile/[username]/page.tsx'] = `'use client';

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
`;

// ==================== 我的文件（glass-card-glow → glass-card） ====================
files['src/app/(main)/my/files/page.tsx'] = `'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { getMyFiles, deleteFile, batchDeleteFiles } from '@/lib/api/files';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FileItem } from '@/types/api';
import {
  Download, FolderOpen, Trash2, Check, X,
  ZoomIn, ZoomOut, CheckSquare, Square, ChevronLeft, ChevronRight,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function MyFilesPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardWidth, setCardWidth] = useState(260);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerDownload, setViewerDownload] = useState<string | undefined>();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = () => {
    setLoading(true);
    getMyFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    load();
  }, [token, router]);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize));
  const pagedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return files.slice(start, start + pageSize);
  }, [files, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handleDeleteOne = async (id: number, name: string) => {
    if (!confirm(\`确认删除「\${name}」？此操作不可恢复。\`)) return;
    try {
      await deleteFile(id);
      setFiles((list) => list.filter((f) => f.id !== id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(\`确认删除选中的 \${selected.size} 个文件？此操作不可恢复。\`)) return;
    try {
      await batchDeleteFiles(Array.from(selected));
      setFiles((list) => list.filter((f) => !selected.has(f.id)));
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '批量删除失败');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = pagedFiles.map((f) => f.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((s) => {
      const next = new Set(s);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const openViewer = (f: FileItem) => {
    const url = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
    setViewerSrc(url);
    setViewerDownload(f.svgUrl ? assetUrl(f.svgUrl) : undefined);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">我的文件</h1>
              <p className="text-sm text-[#f2f2f2]/50">
                {loading
                  ? '加载中...'
                  : \`共 \${files.length} 个文件 · 第 \${page} / \${totalPages} 页\${selected.size > 0 ? \` · 已选 \${selected.size}\` : ''}\`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <ZoomOut className="w-4 h-4 text-[#f2f2f2]/40" />
                <input
                  type="range"
                  min={180}
                  max={420}
                  step={20}
                  value={cardWidth}
                  onChange={(e) => setCardWidth(Number(e.target.value))}
                  className="w-24 accent-[#f9cf00]"
                />
                <ZoomIn className="w-4 h-4 text-[#f2f2f2]/40" />
              </div>

              {selectMode ? (
                <>
                  <button onClick={toggleSelectAllOnPage} className="btn-secondary">
                    {pagedFiles.every((f) => selected.has(f.id)) ? (
                      <><CheckSquare className="w-4 h-4" /> 取消本页</>
                    ) : (
                      <><Square className="w-4 h-4" /> 选择本页</>
                    )}
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selected.size === 0}
                    className="btn-primary bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="w-4 h-4" /> 删除 ({selected.size})
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelected(new Set());
                    }}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {files.length > 0 && (
                    <button onClick={() => setSelectMode(true)} className="btn-secondary">
                      <Check className="w-4 h-4" /> 批量管理
                    </button>
                  )}
                  <Link href="/tools/image-to-svg" className="btn-primary">
                    新建转换
                  </Link>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="glass-card p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-[#f2f2f2]/40" />
              </div>
              <p className="text-[#f2f2f2]/60 mb-4">还没有文件</p>
              <Link href="/tools/image-to-svg" className="btn-primary">
                去转换一张
              </Link>
            </div>
          )}

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: \`repeat(auto-fill, minmax(\${cardWidth}px, 1fr))\` }}
          >
            {pagedFiles.map((f) => {
              const isSelected = selected.has(f.id);
              const imgSrc = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
              return (
                <div
                  key={f.id}
                  className={\`glass-card transition-all \${
                    isSelected ? 'ring-2 ring-[#f9cf00]' : ''
                  }\`}
                >
                  <div className="relative aspect-square bg-white/5 border-b border-white/5 overflow-hidden group rounded-t-2xl">
                    <img
                      src={imgSrc}
                      alt={f.name}
                      className="w-full h-full object-contain cursor-zoom-in transition-transform group-hover:scale-[1.02]"
                      onClick={() => openViewer(f)}
                    />

                    {!selectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOne(f.id, f.name);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {selectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(f.id);
                        }}
                        className={\`absolute top-2 left-2 w-7 h-7 rounded-md flex items-center justify-center border-2 transition-all \${
                          isSelected
                            ? 'bg-[#f9cf00] border-[#f9cf00] text-black'
                            : 'bg-black/40 border-white/40 hover:border-white'
                        }\`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    )}

                    {f.svgUrl && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#f9cf00] text-black text-[10px] font-bold">
                        SVG
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="font-medium truncate mb-1 text-sm" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-xs text-[#f2f2f2]/40 mb-4">
                      {f.format} · {(f.size / 1024).toFixed(1)} KB
                      {f.width && f.height && \` · \${f.width}×\${f.height}\`}
                    </p>
                    {f.svgUrl && (
                      <a
                        href={assetUrl(f.svgUrl)}
                        download
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> 下载 SVG
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {files.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-[#f2f2f2]/60">
                <span>每页显示</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#f2f2f2] text-sm outline-none focus:border-[#f9cf00] transition-colors"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n} className="bg-[#15161a]">{n}</option>
                  ))}
                </select>
                <span>条</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {generatePageNumbers(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={\`e-\${i}\`} className="px-2 text-[#f2f2f2]/40">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={\`min-w-[36px] h-9 px-3 rounded-lg text-sm transition-colors \${
                        p === page
                          ? 'bg-[#f9cf00] text-black font-semibold'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }\`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt="预览"
          downloadUrl={viewerDownload}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (current > 4) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}
`;

// ==================== 转换工作台（glass-card-glow → glass-card） ====================
files['src/app/(main)/tools/image-to-svg/page.tsx'] = `'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import { convertImage } from '@/lib/api/conversion';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { ConvertResponse } from '@/types/api';
import { Image as ImageIcon, Download, X, ArrowRight, Loader2, ZoomIn } from 'lucide-react';

export default function ImageToSvgPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerDownload, setViewerDownload] = useState<string | undefined>();

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleConvert = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (!file) {
      setError('请先选择图片');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await convertImage(file);
      if (res.status === 'success') {
        setResult(res);
      } else {
        setError(res.message || '转换失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
  };

  const openViewer = (src: string, download?: string) => {
    setViewerSrc(src);
    setViewerDownload(download);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">图片转 SVG</h1>
            <p className="text-[#f2f2f2]/50">上传图片，一键生成矢量图形</p>
          </div>

          {!result && (
            <div className="glass-card p-8 mb-6">
              <div
                {...getRootProps()}
                className={\`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all \${
                  isDragActive
                    ? 'border-[#f9cf00] bg-[#f9cf00]/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/2'
                }\`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="预览" className="max-h-96 mx-auto rounded-xl" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAll();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-[#f2f2f2]/40" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? '松开以上传' : '拖拽图片到此处'}
                    </p>
                    <p className="text-sm text-[#f2f2f2]/40">
                      或点击选择 · 支持 PNG / JPG / WebP · 最大 10MB
                    </p>
                  </>
                )}
              </div>

              {file && (
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-[#f2f2f2]/60">
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleConvert}
                  disabled={loading || !file}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 转换中
                    </>
                  ) : (
                    <>
                      开始生成 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {result && result.svgUrl && (
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">转换结果</h2>
                <button
                  onClick={clearAll}
                  className="text-sm text-[#f2f2f2]/50 hover:text-[#f2f2f2] transition-colors"
                >
                  转换新图片
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">原图</p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => openViewer(assetUrl(result.originalUrl)!)}
                  >
                    <img
                      src={assetUrl(result.originalUrl)}
                      alt="原图"
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm text-[#f2f2f2]/50 mb-3">SVG</p>
                  <div
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => openViewer(assetUrl(result.svgUrl)!, assetUrl(result.svgUrl)!)}
                  >
                    <img
                      src={assetUrl(result.svgUrl)}
                      alt="SVG"
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a href={assetUrl(result.svgUrl)} download className="btn-primary">
                  <Download className="w-4 h-4" /> 下载 SVG
                </a>
                <button onClick={() => router.push('/my/files')} className="btn-secondary">
                  查看我的文件
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt="预览"
          downloadUrl={viewerDownload}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </>
  );
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
