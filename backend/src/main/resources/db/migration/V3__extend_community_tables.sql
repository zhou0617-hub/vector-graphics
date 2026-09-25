-- V3: 扩展社区相关表，支持作品与文件解耦、浏览量、标签热度
-- 作者：AI 协作
-- 日期：2026-09-25

-- 1. posts 表新增 view_count
ALTER TABLE posts
    ADD COLUMN view_count INT NOT NULL DEFAULT 0 COMMENT '浏览量' AFTER comment_count;

-- 2. post_files 表新增冗余字段（发布时从 files 表复制快照，独立于源文件）
ALTER TABLE post_files
    ADD COLUMN name       VARCHAR(255) NOT NULL DEFAULT ''   COMMENT '文件名快照'   AFTER file_id,
    ADD COLUMN url        VARCHAR(512) NOT NULL DEFAULT ''   COMMENT '图片URL快照'  AFTER name,
    ADD COLUMN format     VARCHAR(16)  NOT NULL DEFAULT ''   COMMENT '格式快照'     AFTER url,
    ADD COLUMN width      INT          NULL                  COMMENT '宽（像素）'   AFTER format,
    ADD COLUMN height     INT          NULL                  COMMENT '高（像素）'   AFTER width,
    ADD COLUMN size       BIGINT       NOT NULL DEFAULT 0    COMMENT '文件大小'     AFTER height,
    ADD COLUMN source     VARCHAR(32)  NOT NULL DEFAULT 'convert' COMMENT '来源：convert/upscale' AFTER size,
    ADD COLUMN sort_order INT          NOT NULL DEFAULT 0    COMMENT '展示顺序'     AFTER source;

-- 3. tags 表新增 usage_count
ALTER TABLE tags
    ADD COLUMN usage_count INT NOT NULL DEFAULT 0 COMMENT '被引用次数' AFTER slug;

-- 4. 补充索引（广场排序、热度排行按时间窗口查询）
CREATE INDEX idx_posts_status_created ON posts (status, created_at DESC);
CREATE INDEX idx_posts_status_like    ON posts (status, like_count  DESC);
CREATE INDEX idx_likes_created        ON likes     (created_at);
CREATE INDEX idx_favorites_created    ON favorites (created_at);
CREATE INDEX idx_comments_created     ON comments  (created_at);