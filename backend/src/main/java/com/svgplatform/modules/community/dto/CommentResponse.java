package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 评论响应体。
 * <p>
 * 顶级评论的 replies 里装子回复；子回复的 replies 始终为空列表。
 */
@Data
public class CommentResponse implements Serializable {

    private Long id;
    private Long postId;
    private Long parentId;
    private String content;
    private LocalDateTime createdAt;

    /** 评论者信息 */
    private Long userId;
    private String username;
    private String userAvatar;

    /** 是否当前用户自己的评论（前端显示删除按钮用） */
    private Boolean mine;

    /** 子回复列表（仅顶级评论有） */
    private List<CommentResponse> replies;
}