package com.svgplatform.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * 发表评论的请求体。
 * <p>
 * parentId 为 null 时是顶级评论，非 null 时是对某条评论的回复。
 */
@Data
public class CommentCreateRequest implements Serializable {

    @NotBlank(message = "评论内容不能为空")
    @Size(min = 1, max = 500, message = "评论内容需在 1-500 字之间")
    private String content;

    /** 父评论 ID（回复场景），顶级评论可不传 */
    private Long parentId;
}