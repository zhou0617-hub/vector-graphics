-- V4: 互动模块补充索引
-- 作者：AI 协作
-- 日期：2026-09-25

-- 评论列表按 (post_id, status, created_at DESC) 排序
CREATE INDEX idx_comments_post_status_created ON comments (post_id, status, created_at DESC);

-- 点赞/收藏的唯一索引已存在（uk_likes_post_user / uk_favorites_post_user），无需新增
-- 但取消点赞后重新点赞的场景需要 (post_id, user_id) 快速查，已有唯一索引覆盖