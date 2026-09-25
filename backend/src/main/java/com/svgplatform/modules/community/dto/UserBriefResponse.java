package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 用户简要信息（搜索结果用）。
 */
@Data
public class UserBriefResponse implements Serializable {

    private Long id;
    private String username;
    private String avatarUrl;
    private String bio;
}