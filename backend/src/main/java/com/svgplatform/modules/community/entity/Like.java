package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 点赞记录实体，对应 likes 表。
 * <p>
 * 唯一索引 (post_id, user_id) 保证同一用户对同一作品只能点赞一次。
 */
@Data
@TableName("likes")
public class Like implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作品 ID */
    private Long postId;

    /** 点赞用户 ID */
    private Long userId;

    /** 点赞时间 */
    private LocalDateTime createdAt;
}