package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 社区作品实体，对应 posts 表。
 * <p>
 * 一个作品由用户发布，可关联多个文件（通过 post_files）。
 * 计数器字段（like_count / favorite_count / comment_count / view_count）
 * 为冗余字段，在互动时同步更新，避免每次查询都做聚合。
 */
@Data
@TableName("posts")
public class Post implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 发布者用户 ID */
    private Long userId;

    /** 标题 */
    private String title;

    /** 描述 */
    private String description;

    /** 封面图 URL（默认取第一个关联文件的图片） */
    private String coverUrl;

    /** 状态：normal / hidden / deleted */
    private String status;

    /** 点赞数（冗余） */
    private Integer likeCount;

    /** 收藏数（冗余） */
    private Integer favoriteCount;

    /** 评论数（冗余） */
    private Integer commentCount;

    /** 浏览量（冗余） */
    private Integer viewCount;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}