'use client';

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
              onClick={() => router.push(`/profile/${currentUser.username}`)}
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
              className={`mt-6 px-4 py-3 rounded-lg text-sm ${
                message.type === 'ok'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => router.push(`/profile/${currentUser.username}`)}
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
