package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 作品详情响应体。比列表项多出：描述、文件列表、当前用户互动状态。
 */
@Data
public class PostDetailResponse implements Serializable {

    private Long id;
    private String title;
    private String description;
    private String coverUrl;

    private Long userId;
    private String username;
    private String userAvatar;

    private Integer likeCount;
    private Integer favoriteCount;
    private Integer commentCount;
    private Integer viewCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 关联的文件列表（按 sortOrder 排序） */
    private List<PostFileResponse> files;

    /** 标签列表 */
    private List<TagResponse> tags;

    /** 当前登录用户是否点过赞（未登录为 false） */
    private Boolean liked;

    /** 当前登录用户是否收藏过（未登录为 false） */
    private Boolean favorited;

    /** 当前登录用户是否是作者 */
    private Boolean mine;
}