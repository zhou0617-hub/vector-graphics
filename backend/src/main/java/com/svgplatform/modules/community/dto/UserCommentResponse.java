package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户发表的评论（个人中心动态用）。
 * 包含评论本身 + 所属帖子的标题和封面，方便前端展示。
 */
@Data
public class UserCommentResponse implements Serializable {

    private Long id;
    private Long postId;
    private String content;
    private LocalDateTime createdAt;

    /** 所属帖子信息 */
    private String postTitle;
    private String postCover;

    /** 该帖子下当前用户发表评论的总条数（合并显示用） */
    private Integer commentCount;
}