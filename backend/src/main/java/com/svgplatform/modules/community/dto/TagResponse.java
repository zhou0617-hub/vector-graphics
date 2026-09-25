package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 标签响应体。
 */
@Data
public class TagResponse implements Serializable {

    private Long id;
    private String name;
    private String slug;
    private Integer usageCount;
}