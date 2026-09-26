'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { ImageViewer } from '@/components/image-viewer';
import {
  getPostDetail, deletePost, viewPost,
  likePost, unlikePost, favoritePost, unfavoritePost,
  listComments, createComment, deleteComment,
, listFavoriteFolders, createFavoriteFolder,\r\n} from '@/lib/api/community';
import { assetUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { PostDetail, CommentItem } from '@/types/api';
import {
  Loader2, ArrowLeft, Eye, Heart, Star, MessageCircle,
  Calendar, Hash, Trash2, ImageOff, AlertCircle,
  Send, CornerDownRight, X, Plus, FolderPlus, Check,
} from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params?.id);

  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  // 浏览量防重复上报（React StrictMode 会双调用 useEffect）
  const viewReportedRef = useRef(false);

  // 收藏夹相关
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // 互动状态：用独立的 state 做乐观更新
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [interacting, setInteracting] = useState(false);

  // 评论
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // ==================== 加载详情 ====================
  const loadDetail = useCallback(() => {
    if (!postId || isNaN(postId)) {
      setError('无效的作品 ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    getPostDetail(postId)
      .then((res) => {
        setPost(res);
        setLiked(res.liked);
        setFavorited(res.favorited);
        setLikeCount(res.likeCount);
        setFavoriteCount(res.favoriteCount);
        setCommentCount(res.commentCount);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail, token]);

  // 浏览量上报：仅在首次挂载时触发一次
  useEffect(() => {
    if (!postId || isNaN(postId)) return;
    if (viewReportedRef.current) return;
    viewReportedRef.current = true;
    viewPost(postId).catch(() => {/* 静默失败 */});
  }, [postId]);

  // ==================== 加载评论 ====================
  const loadComments = useCallback(() => {
    if (!postId || isNaN(postId)) return;
    setCommentLoading(true);
    listComments(postId)
      .then(setComments)
      .catch(() => {/* 静默失败 */})
      .finally(() => setCommentLoading(false));
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ==================== 点赞（乐观更新）====================
  const handleToggleLike = async () => {
    if (!token) {
      router.push(`/login?redirect=/community/post/${postId}`);
      return;
    }
    if (interacting) return;
    setInteracting(true);
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    // 乐观更新
    setLiked(nextLiked);
    setLikeCount(nextCount);
    try {
      if (nextLiked) await likePost(postId);
      else await unlikePost(postId);
    } catch {
      // 回滚
      setLiked(!nextLiked);
      setLikeCount(likeCount);
    } finally {
      setInteracting(false);
    }
  };

  // ==================== 收藏 ====================
  /**
   * 点击收藏按钮：
   * - 已收藏 → 直接取消
   * - 未收藏 → 打开收藏夹选择弹窗
   */
  const handleToggleFavorite = () => {
    if (!token) {
      router.push(`/login?redirect=/community/post/${postId}`);
      return;
    }
    if (interacting) return;

    if (favorited) {
      // 已收藏 → 直接取消
      (async () => {
        setInteracting(true);
        setFavorited(false);
        setFavoriteCount((c) => Math.max(0, c - 1));
        try {
          await unfavoritePost(postId);
        } catch {
          setFavorited(true);
          setFavoriteCount((c) => c + 1);
        } finally {
          setInteracting(false);
        }
      })();
    } else {
      // 未收藏 → 打开收藏夹选择
      openFolderPicker();
    }
  };

  /** 打开收藏夹弹窗并加载收藏夹列表 */
  const openFolderPicker = async () => {
    setShowFolderPicker(true);
    setFolderLoading(true);
    try {
      const list = await listFavoriteFolders();
      setFolders(list);
    } catch {
      setFolders([]);
    } finally {
      setFolderLoading(false);
    }
  };

  /** 选择某个收藏夹完成收藏 */
  const handleSelectFolder = async (folderId: number | null) => {
    setInteracting(true);
    setFavorited(true);
    setFavoriteCount((c) => c + 1);
    setShowFolderPicker(false);
    try {
      await favoritePost(postId, folderId ?? undefined);
      // 若指定了收藏夹，刷新一下收藏夹的 itemCount（下次打开弹窗会重新拉）
    } catch {
      setFavorited(false);
      setFavoriteCount((c) => Math.max(0, c - 1));
    } finally {
      setInteracting(false);
    }
  };

  /** 在当前弹窗内创建新收藏夹并收藏 */
  const handleCreateAndFavorite = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const folder = await createFavoriteFolder({ name, isPublic: false });
      setNewFolderName('');
      setCreatingFolder(false);
      await handleSelectFolder(folder.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    }
  };

  // ==================== 发表评论 ====================
  const handleSubmitComment = async () => {
    if (!token) {
      router.push(`/login?redirect=/community/post/${postId}`);
      return;
    }
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await createComment(postId, {
        content: commentText.trim(),
        parentId: replyTo?.id,
      });
      setCommentText('');
      setReplyTo(null);
      setCommentCount((c) => c + 1);
      loadComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '发表失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ==================== 删除评论 ====================
  const handleDeleteComment = async (id: number) => {
    if (!confirm('确认删除这条评论？')) return;
    try {
      await deleteComment(id);
      setCommentCount((c) => Math.max(0, c - 1));
      loadComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  // ==================== 删除作品 ====================
  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('确认删除这个作品？此操作不可恢复。')) return;
    try {
      await deletePost(post.id);
      router.push('/community?toast=' + encodeURIComponent('作品已删除'));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ==================== 渲染 ====================
  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center text-[#f2f2f2]/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
        </main>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#f2f2f2]/60">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p>{error || '作品不存在'}</p>
          <Link href="/community" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> 返回广场
          </Link>
        </main>
      </>
    );
  }

  const files = post.files || [];
  const current = files[activeIndex];
  const currentUrl = current ? assetUrl(current.url) : null;
  const isMine = post.mine;

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#f9cf00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          {/* 顶部导航栏 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-sm text-[#f2f2f2]/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> 返回广场
            </Link>

            {isMine && (
              <button
                onClick={handleDeletePost}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除作品
              </button>
            )}
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          {/* 作者信息栏 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#f2f2f2]/60 mb-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-xs font-bold overflow-hidden">
                {post.userAvatar ? (
                  <img src={assetUrl(post.userAvatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  (post.username?.[0] || '?').toUpperCase()
                )}
              </div>
              <span className="text-white/80">{post.username || '匿名'}</span>
            </div>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {post.viewCount} 浏览
            </span>
          </div>

          {/* 图片区 */}
          {files.length === 0 ? (
            <div className="glass-card aspect-square flex items-center justify-center mb-8">
              <ImageOff className="w-16 h-16 text-[#f2f2f2]/20" />
            </div>
          ) : (
            <div className="mb-8">
              <div className="glass-card relative bg-black/30 overflow-hidden">
                <div className="relative h-[50vh] max-h-[500px]">
                  {files.map((f, i) => {
                    const url = assetUrl(f.url);
                    return (
                      <div
                        key={f.id}
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                          i === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      >
                        <img
                          src={url}
                          alt={f.name || post.title}
                          className="max-w-full max-h-full object-contain cursor-zoom-in"
                          onClick={() => setViewerSrc(url)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {files.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {files.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveIndex(i)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeIndex
                          ? 'border-[#f9cf00]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={assetUrl(f.url)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 互动栏 */}
          <div className="glass-card p-5 mb-6 flex items-center justify-around">
            <button
              onClick={handleToggleLike}
              disabled={interacting}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                liked ? 'text-red-400' : 'text-[#f2f2f2]/60 hover:text-red-400'
              } disabled:opacity-60`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
              <span className="text-xs">点赞 {likeCount}</span>
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={interacting}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                favorited ? 'text-[#f9cf00]' : 'text-[#f2f2f2]/60 hover:text-[#f9cf00]'
              } disabled:opacity-60`}
            >
              <Star className={`w-6 h-6 ${favorited ? 'fill-current' : ''}`} />
              <span className="text-xs">收藏 {favoriteCount}</span>
            </button>
            <div className="flex flex-col items-center gap-1.5 text-[#f2f2f2]/60">
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">评论 {commentCount}</span>
            </div>
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-[#f2f2f2]/70"
                >
                  <Hash className="w-3 h-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 描述 */}
          {post.description && (
            <div className="glass-card p-6 mb-8">
              <h2 className="text-sm font-medium mb-3 text-[#f2f2f2]/60">作品描述</h2>
              <p className="text-[#f2f2f2]/90 whitespace-pre-wrap leading-relaxed">
                {post.description}
              </p>
            </div>
          )}

          {/* ==================== 评论区 ==================== */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium mb-4">
              评论
              <span className="text-sm text-[#f2f2f2]/40 ml-2">{commentCount}</span>
            </h2>

            {/* 输入框 */}
            {token ? (
              <div className="mb-6">
                {replyTo && (
                  <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10 text-xs text-[#f2f2f2]/60">
                    <span className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      回复 @{replyTo.username || '匿名'}：{replyTo.content.slice(0, 30)}
                      {replyTo.content.length > 30 && '...'}
                    </span>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                    placeholder={replyTo ? '写下你的回复...' : '说点什么吧...'}
                    rows={2}
                    maxLength={500}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#f9cf00] transition-colors resize-none text-sm"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="px-4 rounded-lg bg-[#f9cf00] text-black font-medium text-sm hover:bg-[#e6bf00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#f2f2f2]/40 mt-2 text-right">
                  {commentText.length} / 500
                </p>
              </div>
            ) : (
              <div className="mb-6 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-center text-sm text-[#f2f2f2]/60">
                <Link
                  href={`/login?redirect=/community/post/${postId}`}
                  className="text-[#f9cf00] hover:underline"
                >
                  登录
                </Link>
                {' '}后可以发表评论
              </div>
            )}

            {/* 评论列表 */}
            {commentLoading && comments.length === 0 ? (
              <div className="text-center py-8 text-[#f2f2f2]/40 text-sm">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> 加载评论...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-[#f2f2f2]/40 text-sm">
                还没有评论，来抢沙发吧
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <CommentNode
                    key={c.id}
                    comment={c}
                    onReply={(target) => {
                      setReplyTo(target);
                      // 滚动到输入框
                      document.querySelector('textarea')?.focus();
                    }}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================== 收藏夹选择弹窗 ==================== */}
      {showFolderPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowFolderPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#15161a] border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-medium">收藏到...</h3>
              <button
                onClick={() => setShowFolderPicker(false)}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 收藏夹列表 */}
            <div className="max-h-80 overflow-y-auto p-2">
              {/* 默认收藏夹 */}
              <button
                onClick={() => handleSelectFolder(null)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f9cf00]/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#f9cf00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">默认收藏夹</p>
                  <p className="text-xs text-white/40">未分类的收藏</p>
                </div>
              </button>

              {folderLoading ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> 加载中...
                </div>
              ) : (
                folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFolder(f.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-white/40">
                        {f.itemCount} 个作品{f.isPublic ? ' · 公开' : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* 新建收藏夹 */}
            <div className="border-t border-white/5 p-4">
              {creatingFolder ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value.slice(0, 64))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndFavorite(); }}
                    placeholder="输入收藏夹名称"
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-[#f9cf00] transition-colors"
                  />
                  <button
                    onClick={handleCreateAndFavorite}
                    disabled={!newFolderName.trim()}
                    className="px-4 rounded-lg bg-[#f9cf00] text-black text-sm font-medium hover:bg-[#e6bf00] disabled:opacity-40 transition-colors"
                  >
                    创建并收藏
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  新建收藏夹
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {viewerSrc && (
        <ImageViewer
          src={viewerSrc}
          alt={post.title}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </>
  );
}

// ==================== 评论节点（递归渲染子回复）====================

function CommentNode({
  comment,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: CommentItem;
  onReply: (c: CommentItem) => void;
  onDelete: (id: number) => void;
  isReply?: boolean;
}) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className={isReply ? 'ml-10 mt-3' : ''}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f9cf00] to-[#ff9500] flex items-center justify-center text-black text-xs font-bold overflow-hidden shrink-0">
          {comment.userAvatar ? (
            <img src={assetUrl(comment.userAvatar)} alt="" className="w-full h-full object-cover" />
          ) : (
            (comment.username?.[0] || '?').toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white/90">
              {comment.username || '匿名'}
            </span>
            <span className="text-xs text-[#f2f2f2]/40">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-[#f2f2f2]/80 whitespace-pre-wrap break-words mb-2">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 text-xs">
            {!isReply && (
              <button
                onClick={() => onReply(comment)}
                className="text-[#f2f2f2]/50 hover:text-[#f9cf00] transition-colors"
              >
                回复
              </button>
            )}
            {comment.mine && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[#f2f2f2]/50 hover:text-red-400 transition-colors"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 子回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l border-white/5">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}