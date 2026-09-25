'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/stores/auth-store';
import { getMyFiles } from '@/lib/api/files';
import { createPost } from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import type { FileItem } from '@/types/api';
import {
  Loader2, Check, X, ImageOff, ArrowLeft, Plus,
  Hash, AlertCircle,
} from 'lucide-react';

/** 预设标签 —— 用户也可以输入自定义 */
const PRESET_TAGS = [
  '风景', '人物', '建筑', '动物', '植物',
  '抽象', '极简', '复古', '科幻', '卡通',
  '图标', '插画', 'Logo', '动漫', '写实',
];

const MAX_FILES = 9;
const MAX_TAGS = 5;
const MAX_TITLE = 100;
const MAX_DESC = 2000;

export default function PublishPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 未登录跳转
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login?redirect=/community/publish');
    }
  }, [hydrated, token, router]);

  // 加载我的文件
  useEffect(() => {
    if (!token) return;
    setLoadingFiles(true);
    getMyFiles()
      .then(setFiles)
      .catch((err) => setError(err instanceof Error ? err.message : '加载文件失败'))
      .finally(() => setLoadingFiles(false));
  }, [token]);

  // 切换文件选中
  const toggleFile = (id: number) => {
    setSelectedFileIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FILES) {
        alert(`最多选择 ${MAX_FILES} 个文件`);
        return prev;
      }
      return [...prev, id];
    });
  };

  // 添加标签
  const addTag = (name: string) => {
    const t = name.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    if (tags.length >= MAX_TAGS) {
      alert(`最多添加 ${MAX_TAGS} 个标签`);
      return;
    }
    setTags([...tags, t]);
    setCustomTag('');
  };

  const removeTag = (name: string) => {
    setTags(tags.filter((t) => t !== name));
  };

  // 提交
  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('请填写标题');
      return;
    }
    if (selectedFileIds.length === 0) {
      setError('请至少选择一个文件');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPost({
        title: title.trim(),
        description: description.trim() || undefined,
        fileIds: selectedFileIds,
        tags: tags.length > 0 ? tags : undefined,
      });
      router.push('/community?toast=' + encodeURIComponent('发布成功') + '&refresh=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
      setSubmitting(false);
    }
  };

  // 加载中（未 hydrate）
  if (!hydrated || !token) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          <Loader2 className="w-5 h-5 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* 返回 */}
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-[#f2f2f2]/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回广场
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">发布作品</h1>
            <p className="text-sm text-[#f2f2f2]/50">
              分享你的创作到社区，让更多人看到
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 标题 */}
          <div className="glass-card p-6 mb-6">
            <label className="block text-sm font-medium mb-3">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="给你的作品起个标题"
              maxLength={MAX_TITLE}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors"
            />
            <p className="text-xs text-[#f2f2f2]/40 mt-2 text-right">
              {title.length} / {MAX_TITLE}
            </p>
          </div>

          {/* 描述 */}
          <div className="glass-card p-6 mb-6">
            <label className="block text-sm font-medium mb-3">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="介绍一下你的作品（可选）"
              rows={4}
              maxLength={MAX_DESC}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors resize-none"
            />
            <p className="text-xs text-[#f2f2f2]/40 mt-2 text-right">
              {description.length} / {MAX_DESC}
            </p>
          </div>

          {/* 文件选择 */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">
                选择文件 <span className="text-red-400">*</span>
                <span className="text-xs text-[#f2f2f2]/40 ml-2">
                  从「我的文件」中选，{selectedFileIds.length} / {MAX_FILES}
                </span>
              </label>
              {selectedFileIds.length > 0 && (
                <button
                  onClick={() => setSelectedFileIds([])}
                  className="text-xs text-[#f2f2f2]/50 hover:text-white transition-colors"
                >
                  清空选择
                </button>
              )}
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center py-12 text-[#f2f2f2]/50">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> 加载文件...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <ImageOff className="w-10 h-10 mx-auto mb-3 text-[#f2f2f2]/30" />
                <p className="text-sm text-[#f2f2f2]/60 mb-4">你还没有任何文件</p>
                <Link href="/tools/image-to-svg" className="btn-primary">
                  <Plus className="w-4 h-4" /> 去转换一张
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {files.map((f) => {
                  const selected = selectedFileIds.includes(f.id);
                  const thumb = f.svgUrl ? assetUrl(f.svgUrl) : assetUrl(f.originalUrl);
                  const idx = selectedFileIds.indexOf(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFile(f.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selected
                          ? 'border-[#f9cf00] ring-2 ring-[#f9cf00]/30'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={f.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#f9cf00] flex items-center justify-center text-black text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 标签 */}
          <div className="glass-card p-6 mb-6">
            <label className="block text-sm font-medium mb-3">
              标签
              <span className="text-xs text-[#f2f2f2]/40 ml-2">
                最多 {MAX_TAGS} 个，{tags.length} / {MAX_TAGS}
              </span>
            </label>

            {/* 已选标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#f9cf00]/15 border border-[#f9cf00]/40 text-[#f9cf00] text-sm"
                  >
                    <Hash className="w-3 h-3" />
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-1 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 自定义输入 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(customTag);
                  }
                }}
                placeholder="输入自定义标签，按回车添加"
                maxLength={20}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => addTag(customTag)}
                disabled={!customTag.trim()}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-colors text-sm"
              >
                添加
              </button>
            </div>

            {/* 预设标签 */}
            <div>
              <p className="text-xs text-[#f2f2f2]/40 mb-2">推荐标签</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => (active ? removeTag(t) : addTag(t))}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        active
                          ? 'bg-[#f9cf00] text-black'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 提交 */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/community" className="btn-secondary">
              取消
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || selectedFileIds.length === 0}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 发布中...</>
              ) : (
                <><Check className="w-4 h-4" /> 发布作品</>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}