package com.svgplatform.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 编辑作品的请求体。字段含义同 PostCreateRequest。
 */
@Data
public class PostUpdateRequest implements Serializable {

    @NotBlank(message = "标题不能为空")
    @Size(min = 1, max = 100, message = "标题长度需在 1-100 之间")
    private String title;

    @Size(max = 2000, message = "描述最多 2000 字")
    private String description;

    @NotEmpty(message = "至少选择一个文件")
    @Size(min = 1, max = 9, message = "最多选择 9 个文件")
    private List<Long> fileIds;

    @Size(max = 5, message = "最多 5 个标签")
    private List<String> tags;
}