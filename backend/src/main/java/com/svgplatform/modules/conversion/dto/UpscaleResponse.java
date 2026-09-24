package com.svgplatform.modules.conversion.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class UpscaleResponse implements Serializable {
    private Long fileId;
    private String status;
    private String originalUrl;
    private String resultUrl;
    private Integer width;
    private Integer height;
    private String message;
}
