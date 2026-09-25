package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 评论实体，对应 comments 表。
 * <p>
 * parent_id 支持二级回复：parent_id 为 null 表示顶级评论，
 * 非 null 表示对某条评论的回复。暂不支持三级以上嵌套。
 */
@Data
@TableName("comments")
public class Comment implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作品 ID */
    private Long postId;

    /** 评论者用户 ID */
    private Long userId;

    /** 父评论 ID（回复场景），顶级评论为 null */
    private Long parentId;

    /** 评论内容 */
    private String content;

    /** 状态：normal / hidden / deleted */
    private String status;

    /** 创建时间 */
    private LocalDateTime createdAt;
}