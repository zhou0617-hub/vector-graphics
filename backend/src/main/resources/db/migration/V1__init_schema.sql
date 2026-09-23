-- =====================
-- Vector Graphics Platform 初始化表
-- =====================

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    email           VARCHAR(128) NOT NULL,
    password_hash   VARCHAR(128) NOT NULL,
    username        VARCHAR(64)  NOT NULL,
    avatar_url      VARCHAR(512) DEFAULT NULL,
    bio             VARCHAR(512) DEFAULT NULL,
    role            VARCHAR(32)  NOT NULL DEFAULT 'user',
    status          VARCHAR(32)  NOT NULL DEFAULT 'active',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS files (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    name            VARCHAR(255) NOT NULL,
    original_url    VARCHAR(512) NOT NULL,
    svg_url         VARCHAR(512) DEFAULT NULL,
    format          VARCHAR(16)  NOT NULL,
    size            BIGINT       NOT NULL DEFAULT 0,
    width           INT          DEFAULT NULL,
    height          INT          DEFAULT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'normal',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_files_user (user_id),
    KEY idx_files_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversions (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    file_id         BIGINT       DEFAULT NULL,
    source_format   VARCHAR(16)  NOT NULL,
    target_format   VARCHAR(16)  NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'pending',
    params_json     TEXT         DEFAULT NULL,
    result_url      VARCHAR(512) DEFAULT NULL,
    error_message   VARCHAR(512) DEFAULT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at     DATETIME     DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_conversions_user (user_id),
    KEY idx_conversions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT         DEFAULT NULL,
    cover_url       VARCHAR(512) DEFAULT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'normal',
    like_count      INT          NOT NULL DEFAULT 0,
    favorite_count  INT          NOT NULL DEFAULT 0,
    comment_count   INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_posts_user (user_id),
    KEY idx_posts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_files (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    post_id         BIGINT NOT NULL,
    file_id         BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_post_files_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    post_id         BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    parent_id       BIGINT       DEFAULT NULL,
    content         TEXT         NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'normal',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_post (post_id),
    KEY idx_comments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS likes (
    id              BIGINT   NOT NULL AUTO_INCREMENT,
    post_id         BIGINT   NOT NULL,
    user_id         BIGINT   NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_likes_post_user (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
    id              BIGINT   NOT NULL AUTO_INCREMENT,
    post_id         BIGINT   NOT NULL,
    user_id         BIGINT   NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_favorites_post_user (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    name            VARCHAR(64)  NOT NULL,
    slug            VARCHAR(64)  NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_tags_name (name),
    UNIQUE KEY uk_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_tags (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    post_id         BIGINT NOT NULL,
    tag_id          BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_post_tags (post_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    reporter_id     BIGINT       NOT NULL,
    target_type     VARCHAR(32)  NOT NULL,
    target_id       BIGINT       NOT NULL,
    reason          VARCHAR(512) NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reports_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
