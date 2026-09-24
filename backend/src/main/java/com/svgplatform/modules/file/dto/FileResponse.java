package com.svgplatform.modules.file.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class FileResponse implements Serializable {

    private Long id;
    private String name;
    private String originalUrl;
    private String svgUrl;
    private String format;
    private String source;
    private Long size;
    private Integer width;
    private Integer height;
    private LocalDateTime createdAt;
}
