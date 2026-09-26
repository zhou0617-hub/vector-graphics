package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 用户在社区中的统计数字。
 * 用于个人中心顶部 4 个卡片实时展示。
 */
@Data
public class UserStatsResponse implements Serializable {

    /** 公开作品数 */
    private Long postCount;

    /** 点赞数 */
    private Long likedCount;

    /** 收藏数 */
    private Long favoritedCount;

    /** 评论数 */
    private Long commentCount;
}