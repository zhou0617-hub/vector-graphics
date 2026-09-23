package com.svgplatform.modules.file.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchDeleteRequest {

    @NotEmpty(message = "文件 ID 列表不能为空")
    private List<Long> ids;
}
