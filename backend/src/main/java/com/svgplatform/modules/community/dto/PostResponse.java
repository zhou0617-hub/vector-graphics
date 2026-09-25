package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 作品列表项响应体（广场、我的发布、搜索等场景通用）。
 */
@Data
public class PostResponse implements Serializable {

    private Long id;
    private String title;
    private String description;
    private String coverUrl;

    /** 作者信息（冗余，避免前端二次请求） */
    private Long userId;
    private String username;
    private String userAvatar;

    private Integer likeCount;
    private Integer favoriteCount;
    private Integer commentCount;
    private Integer viewCount;

    private LocalDateTime createdAt;

    /** 标签列表 */
    private List<TagResponse> tags;
}