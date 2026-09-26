-- V5: 收藏夹功能
-- 作者：AI 协作
-- 日期：2026-09-25

-- 1. 创建收藏夹表
CREATE TABLE favorite_folders (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL COMMENT '所属用户',
    name        VARCHAR(64)  NOT NULL COMMENT '收藏夹名称',
    description VARCHAR(512) NULL     COMMENT '描述',
    is_public   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否公开：0=私密 1=公开',
    item_count  INT          NOT NULL DEFAULT 0 COMMENT '收藏数（冗余）',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_favorite_folders_user (user_id),
    UNIQUE KEY uk_favorite_folders_user_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏夹';

-- 2. favorites 表增加 folder_id 字段（NULL 表示默认收藏夹）
ALTER TABLE favorites
    ADD COLUMN folder_id BIGINT NULL COMMENT '收藏夹 ID（NULL = 默认）' AFTER user_id;

CREATE INDEX idx_favorites_folder ON favorites (folder_id);