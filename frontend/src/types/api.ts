export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface FileItem {
  id: number;
  name: string;
  originalUrl: string;
  svgUrl: string | null;
  format: string;
  source: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface UpscaleResponse {
  fileId: number;
  status: string;
  originalUrl: string | null;
  resultUrl: string | null;
  width: number | null;
  height: number | null;
  message: string;
}

export interface ConvertResponse {
  conversionId: number;
  fileId: number;
  status: string;
  svgUrl: string | null;
  originalUrl: string | null;
  width: number | null;
  height: number | null;
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ==================== 社区模块 ====================

/** 分页响应（与后端 PageResponse<T> 对应） */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/** 标签 */
export interface PostTag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

/** 作品列表项 */
export interface PostItem {
  id: number;
  title: string;
  coverUrl: string | null;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  tags: PostTag[];
}

/** 作品中的单个文件（快照） */
export interface PostFileItem {
  id: number;
  name: string;
  url: string;
  format: string;
  width: number | null;
  height: number | null;
  size: number;
  source: string;
}

/** 作品详情 */
export interface PostDetail {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  files: PostFileItem[];
  tags: PostTag[];
  liked: boolean;
  favorited: boolean;
  mine: boolean;
}

/** 发布/编辑作品请求 */
export interface PostSaveRequest {
  title: string;
  description?: string;
  fileIds: number[];
  tags?: string[];
}
// ==================== 社区模块 ====================

/** 分页响应（与后端 PageResponse<T> 对应） */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/** 标签 */
export interface PostTag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

/** 作品列表项 */
export interface PostItem {
  id: number;
  title: string;
  coverUrl: string | null;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  tags: PostTag[];
}

/** 作品中的单个文件（快照） */
export interface PostFileItem {
  id: number;
  name: string;
  url: string;
  format: string;
  width: number | null;
  height: number | null;
  size: number;
  source: string;
}

/** 作品详情 */
export interface PostDetail {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  files: PostFileItem[];
  tags: PostTag[];
  liked: boolean;
  favorited: boolean;
  mine: boolean;
}

/** 发布/编辑作品请求 */
export interface PostSaveRequest {
  title: string;
  description?: string;
  fileIds: number[];
  tags?: string[];
}
// ==================== 评论模块 ====================

/** 评论项 */
export interface CommentItem {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  userId: number;
  username: string | null;
  userAvatar: string | null;
  /** 是否当前用户自己的评论 */
  mine: boolean;
  /** 子回复列表（仅顶级评论有） */
  replies: CommentItem[];
}

/** 发表评论请求 */
export interface CommentCreateRequest {
  content: string;
  parentId?: number;
}
// ==================== 搜索模块 ====================

/** 用户简要信息（搜索结果用） */
export interface UserBrief {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}
/** 用户发表的评论（个人中心动态用） */
export interface UserCommentResponse {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  postTitle: string | null;
  postCover: string | null;
}
/** 用户在社区的统计数字 */
export interface UserStats {
  postCount: number;
  likedCount: number;
  favoritedCount: number;
  commentCount: number;
}
// ==================== 收藏夹 ====================

/** 收藏夹 */
export interface FavoriteFolder {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
}

/** 创建/编辑收藏夹请求 */
export interface FavoriteFolderRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}