'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/stores/auth-store';
import { assetUrl } from '@/lib/api/client';
import {
  listFavoriteFolders,
  createFavoriteFolder,
  updateFavoriteFolder,
  deleteFavoriteFolder,
  listFavoritedInFolder,
} from '@/lib/api/community';
import type { FavoriteFolder, PostItem } from '@/types/api';
import {
  Loader2, Folder, Star, Plus, Pencil, Trash2,
  ImageOff, Heart, Eye, Lock, Globe, X, Check,
} from 'lucide-react';

export default function MyFavoritesPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null | 'all'>('all');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');

  // 收藏夹编辑弹窗
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderPublic, setFolderPublic] = useState(false);

  // ==================== 加载收藏夹列表 ====================
  const loadFolders = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listFavoriteFolders();
      setFolders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载收藏夹失败');
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return;
    setLoading(true);
    loadFolders().finally(() => setLoading(false));
  }, [hydrated, user, loadFolders]);

  // ==================== 加载当前收藏夹的作品 ====================
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setPostsLoading(true);

    const promise = activeFolderId === 'all'
      ? import('@/lib/api/community').then((m) => m.listAllFavorited(user.id))
      : listFavoritedInFolder(user.id, activeFolderId);

    promise
      .then((r) => {
        if (!cancelled) setPosts(r.items);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, activeFolderId]);

  // ==================== 创建 / 编辑 ====================
  const openCreateModal = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDesc('');
    setFolderPublic(false);
    setShowFolderModal(true);
  };

  const openEditModal = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDesc(folder.description || '');
    setFolderPublic(folder.isPublic);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;
    try {
      if (editingFolder) {
        await updateFavoriteFolder(editingFolder.id, {
          name: folderName.trim(),
          description: folderDesc.trim() || undefined,
          isPublic: folderPublic,
        });
      } else {
        await createFavoriteFolder({
          name: folderName.trim(),
          description: folderDesc.trim() || undefined,
          isPublic: folderPublic,
        });
      }
      setShowFolderModal(false);
      await loadFolders();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDeleteFolder = async (folder: FavoriteFolder) => {
    if (!confirm(`确认删除收藏夹「${folder.name}」？夹内作品会移到默认收藏夹。`)) return;
    try {
      await deleteFavoriteFolder(folder.id);
      await loadFolders();
      if (activeFolderId === folder.id) setActiveFolderId('all');
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  // 未登录
  if (!hydrated) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          <Loader2 className="w-5 h-5 animate-spin" />
        </main>
      </>
    );
  }

  if (!token || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#f2f2f2]/50">
          <Star className="w-10 h-10" />
          <p>登录后查看我的收藏</p>
          <Link href="/login?redirect=/my/favorites" className="btn-primary">去登录</Link>
        </main>
      </>
    );
  }

  const currentFolderTitle =
    activeFolderId === 'all'
      ? '全部收藏'
      : activeFolderId === null
        ? '默认收藏夹'
        : folders.find((f) => f.id === activeFolderId)?.name || '收藏夹';

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Star className="w-7 h-7 text-[#f9cf00]" />
                我的收藏
              </h1>
              <p className="text-sm text-[#f2f2f2]/50">
                共 {folders.length} 个收藏夹 · 当前：{currentFolderTitle}
              </p>
            </div>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus className="w-4 h-4" /> 新建收藏夹
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* ==================== 左侧：收藏夹列表 ==================== */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-2">
              {/* 全部 */}
              <button
                onClick={() => setActiveFolderId('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeFolderId === 'all'
                    ? 'bg-[#f9cf00]/10 border border-[#f9cf00]/30 text-[#f9cf00]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <Star className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate font-medium">全部收藏</span>
              </button>

              {/* 默认收藏夹 */}
              <button
                onClick={() => setActiveFolderId(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeFolderId === null
                    ? 'bg-[#f9cf00]/10 border border-[#f9cf00]/30 text-[#f9cf00]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate font-medium">默认收藏夹</span>
              </button>

              {/* 分隔 */}
              {folders.length > 0 && (
                <div className="pt-2 pb-1">
                  <p className="text-xs text-[#f2f2f2]/40 px-2">我的收藏夹</p>
                </div>
              )}

              {/* 用户创建的收藏夹 */}
              {folders.map((f) => {
                const active = activeFolderId === f.id;
                return (
                  <div
                    key={f.id}
                    className={`group flex items-center gap-2 rounded-xl transition-colors ${
                      active
                        ? 'bg-[#f9cf00]/10 border border-[#f9cf00]/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFolderId(f.id)}
                      className={`flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0 ${
                        active ? 'text-[#f9cf00]' : 'text-white/80'
                      }`}
                    >
                      <Folder className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{f.name}</p>
                        <p className="text-xs text-[#f2f2f2]/40 mt-0.5">
                          {f.itemCount} 个 · {f.isPublic ? '公开' : '私密'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(f); }}
                        className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                        className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </aside>

            {/* ==================== 右侧：作品网格 ==================== */}
            <section className="min-w-0">
              {loading || postsLoading ? (
                <div className="text-center py-20 text-[#f2f2f2]/40">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> 加载中...
                </div>
              ) : posts.length === 0 ? (
                <div className="glass-card p-16 text-center">
                  <ImageOff className="w-12 h-12 mx-auto mb-4 text-[#f2f2f2]/20" />
                  <p className="text-[#f2f2f2]/50 text-sm">此收藏夹暂无作品</p>
                  <Link href="/community" className="btn-secondary mt-4 inline-flex">
                    去社区逛逛
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/community/post/${p.id}`}
                      className="group glass-card overflow-hidden hover:border-[#f9cf00]/40 transition-all"
                    >
                      <div className="aspect-square bg-white/5 overflow-hidden">
                        {p.coverUrl ? (
                          <img
                            src={assetUrl(p.coverUrl)}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#f2f2f2]/20">
                            <ImageOff className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate mb-1.5 group-hover:text-[#f9cf00] transition-colors">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#f2f2f2]/50">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likeCount}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.viewCount}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ==================== 收藏夹编辑弹窗 ==================== */}
      {showFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowFolderModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-medium">
                {editingFolder ? '编辑收藏夹' : '新建收藏夹'}
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#f2f2f2]/60 mb-2">
                  名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value.slice(0, 64))}
                  placeholder="例如：插画灵感"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-[#f2f2f2]/60 mb-2">描述</label>
                <textarea
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value.slice(0, 512))}
                  placeholder="可选"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors resize-none text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setFolderPublic((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm">
                  {folderPublic ? <Globe className="w-4 h-4 text-[#f9cf00]" /> : <Lock className="w-4 h-4 text-white/50" />}
                  {folderPublic ? '公开收藏夹' : '私密收藏夹'}
                </span>
                <span className={`w-10 h-5 rounded-full transition-colors relative ${folderPublic ? 'bg-[#f9cf00]' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${folderPublic ? 'left-5' : 'left-0.5'}`} />
                </span>
              </button>
            </div>

            <div className="border-t border-white/5 px-5 py-4 flex justify-end gap-2">
              <button onClick={() => setShowFolderModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleSaveFolder}
                disabled={!folderName.trim()}
                className="btn-primary disabled:opacity-40"
              >
                <Check className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}