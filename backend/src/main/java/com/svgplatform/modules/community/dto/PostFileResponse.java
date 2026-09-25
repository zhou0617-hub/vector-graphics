package com.svgplatform.modules.community.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 作品中的单个文件（快照）响应体。
 */
@Data
public class PostFileResponse implements Serializable {

    private Long id;
    private String name;
    private String url;
    private String format;
    private Integer width;
    private Integer height;
    private Long size;
    private String source;
}