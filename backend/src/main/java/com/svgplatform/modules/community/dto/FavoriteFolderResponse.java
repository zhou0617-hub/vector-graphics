package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 收藏夹响应体。
 */
@Data
public class FavoriteFolderResponse implements Serializable {

    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;
    private Integer itemCount;
    private LocalDateTime createdAt;
}