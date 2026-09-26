import { request } from './client';
import type {
  UserBrief,
  PostItem,
  PostDetail,
  PostSaveRequest,
  CommentItem,
  CommentCreateRequest,
  PageResponse,
} from '@/types/api';

// ==================== 作品 ====================

/**
 * 广场作品列表。
 *
 * @param params.sort   排序：latest / like / comment / favorite / hot
 * @param params.page   页码，从 1 开始
 * @param params.size   每页条数
 * @param params.tagId  可选，按标签过滤
 */
export function listPosts(params?: {
  sort?: string;
  page?: number;
  size?: number;
  tagId?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.size) qs.set('size', String(params.size));
  if (params?.tagId != null) qs.set('tagId', String(params.tagId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<PageResponse<PostItem>>(`/api/community/posts${suffix}`);
}

/**
 * 热度排行。
 *
 * @param period day / week / month / year / all
 * @param limit  返回条数，默认 50
 */
export function getRanking(period: string = 'day', limit: number = 50) {
  return request<PostItem[]>(
    `/api/community/posts/ranking?period=${period}&limit=${limit}`
  );
}

/**
 * 作品详情。未登录也可访问（liked/favorited/mine 会全为 false）。
 */
export function getPostDetail(id: number) {
  return request<PostDetail>(`/api/community/posts/${id}`);
}

/**
 * 发布作品。需要登录。
 */
export function createPost(data: PostSaveRequest) {
  return request<PostDetail>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 编辑作品。仅作者本人可调用。
 */
export function updatePost(id: number, data: PostSaveRequest) {
  return request<PostDetail>(`/api/community/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * 删除作品（软删除）。仅作者本人可调用。
 */
export function deletePost(id: number) {
  return request<void>(`/api/community/posts/${id}`, { method: 'DELETE' });
}

/**
 * 某用户的作品列表。
 */
export function listPostsByUser(userId: number, page: number = 1, size: number = 20) {
  return request<PageResponse<PostItem>>(
    `/api/community/posts/user/${userId}?page=${page}&size=${size}`
  );
}

// ==================== 点赞 ====================

/** 点赞 */
export function likePost(id: number) {
  return request<void>(`/api/community/posts/${id}/like`, { method: 'POST' });
}

/** 取消点赞 */
export function unlikePost(id: number) {
  return request<void>(`/api/community/posts/${id}/like`, { method: 'DELETE' });
}

// ==================== 收藏 ====================

/** 收藏（可指定收藏夹，不传 folderId 表示默认） */
export function favoritePost(id: number, folderId?: number) {
  const suffix = folderId != null ? `?folderId=${folderId}` : '';
  return request<void>(`/api/community/posts/${id}/favorite${suffix}`, { method: 'POST' });
}

/** 取消收藏 */
export function unfavoritePost(id: number) {
  return request<void>(`/api/community/posts/${id}/favorite`, { method: 'DELETE' });
}

// ==================== 评论 ====================

/** 发表评论（parentId 可选，表示回复某条评论） */
export function createComment(postId: number, data: CommentCreateRequest) {
  return request<CommentItem>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 评论列表（两级结构） */
export function listComments(postId: number) {
  return request<CommentItem[]>(`/api/community/posts/${postId}/comments`);
}

/** 删除评论（仅自己的） */
export function deleteComment(commentId: number) {
  return request<void>(`/api/community/comments/${commentId}`, { method: 'DELETE' });
}
// ==================== 浏览量 ====================

/**
 * 浏览量 +1。详情页挂载时调用一次即可。
 * 使用 useRef 防止 React StrictMode 下重复上报。
 */
export function viewPost(id: number) {
  return request<void>(`/api/community/posts/${id}/view`, { method: 'POST' });
}
// ==================== 搜索 ====================

/** 搜索作品，支持关键词 + 标签 + 时间范围 + 来源 */
export function searchPosts(
  q: string,
  opts: {
    includeTagIds?: number[];
    excludeTagIds?: number[];
    range?: string;
    source?: string;
    page?: number;
    size?: number;
  } = {}
) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (opts.includeTagIds && opts.includeTagIds.length > 0) {
    opts.includeTagIds.forEach((id) => qs.append('includeTagIds', String(id)));
  }
  if (opts.excludeTagIds && opts.excludeTagIds.length > 0) {
    opts.excludeTagIds.forEach((id) => qs.append('excludeTagIds', String(id)));
  }
  if (opts.range) qs.set('range', opts.range);
  if (opts.source) qs.set('source', opts.source);
  qs.set('page', String(opts.page ?? 1));
  qs.set('size', String(opts.size ?? 20));
  return request<PageResponse<PostItem>>(`/api/community/search/posts?${qs.toString()}`);
}

/** 搜索用户（用户名） */
export function searchUsers(q: string, page: number = 1, size: number = 20) {
  return request<PageResponse<UserBrief>>(
    `/api/community/search/users?q=${encodeURIComponent(q)}&page=${page}&size=${size}`
  );
}

/** 搜索标签（按引用次数降序） */
export function searchTags(q: string, limit: number = 20) {
  return request<PostTag[]>(
    `/api/community/search/tags?q=${encodeURIComponent(q)}&limit=${limit}`
  );
}
/** 随机获取一个作品 ID（用于"随机一部作品"按钮） */
export function getRandomPostId() {
  return request<number | null>('/api/community/posts/random');
}
/** 列出全部标签，按引用次数降序 */
export function listAllTags() {
  return request<PostTag[]>('/api/community/tags');
}
/** 带筛选的作品分页查询 */
export function searchPagedPosts(params: {
  sort?: string;
  order?: string;
  range?: string;
  tagId?: number;
  source?: string;
  page?: number;
  size?: number;
}) {
  const qs = new URLSearchParams();
  if (params.sort) qs.set('sort', params.sort);
  if (params.order) qs.set('order', params.order);
  if (params.range) qs.set('range', params.range);
  if (params.tagId != null) qs.set('tagId', String(params.tagId));
  if (params.source) qs.set('source', params.source);
  if (params.page) qs.set('page', String(params.page));
  if (params.size) qs.set('size', String(params.size));
  return request<PageResponse<PostItem>>(`/api/community/posts/search?${qs.toString()}`);
}

/** 获取用户在社区的统计数字（作品/点赞/收藏/评论） */
export function getUserStats(userId: number) {
  return request<UserStats>(`/api/community/posts/user/${userId}/stats`);
}
// ==================== 收藏夹 ====================

/** 列出当前用户的所有收藏夹 */
export function listFavoriteFolders() {
  return request<FavoriteFolder[]>('/api/community/favorite-folders');
}

/** 创建收藏夹 */
export function createFavoriteFolder(data: FavoriteFolderRequest) {
  return request<FavoriteFolder>('/api/community/favorite-folders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 编辑收藏夹 */
export function updateFavoriteFolder(id: number, data: FavoriteFolderRequest) {
  return request<FavoriteFolder>(`/api/community/favorite-folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** 删除收藏夹（夹内收藏归到默认收藏夹） */
export function deleteFavoriteFolder(id: number) {
  return request<void>(`/api/community/favorite-folders/${id}`, { method: 'DELETE' });
}
/**
 * 用户在某个收藏夹下的作品。
 * @param userId   用户 ID
 * @param folderId 收藏夹 ID，null 表示"默认收藏夹"
 */
export function listFavoritedInFolder(userId: number, folderId: number | null) {
  const suffix = folderId == null ? '' : `?folderId=${folderId}`;
  return request<PageResponse<PostItem>>(
    `/api/community/posts/user/${userId}/favorited${suffix}`
  );
}

/** 用户所有收藏（不分收藏夹） */
export function listAllFavorited(userId: number) {
  return request<PageResponse<PostItem>>(
    `/api/community/posts/user/${userId}/favorited?all=true`
  );
}