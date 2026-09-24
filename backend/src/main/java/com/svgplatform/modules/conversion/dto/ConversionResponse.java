package com.svgplatform.modules.conversion.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class ConversionResponse implements Serializable {
    private Long id;
    private Long fileId;
    private String sourceFormat;
    private String targetFormat;
    private String status;
    private String paramsJson;
    private String resultUrl;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;
}