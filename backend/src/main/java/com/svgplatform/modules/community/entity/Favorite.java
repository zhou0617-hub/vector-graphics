package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 收藏记录实体，对应 favorites 表。
 * <p>
 * 唯一索引 (post_id, user_id) 保证同一用户对同一作品只能收藏一次。
 */
@Data
@TableName("favorites")
public class Favorite implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作品 ID */
    private Long postId;

    /** 收藏用户 ID */
    private Long userId;

    /** 收藏时间 */
    private LocalDateTime createdAt;
}