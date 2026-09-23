package com.svgplatform.modules.conversion.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class ConvertResponse implements Serializable {

    private Long conversionId;
    private Long fileId;
    private String status;
    private String svgUrl;
    private String originalUrl;
    private Integer width;
    private Integer height;
    private String message;
}
