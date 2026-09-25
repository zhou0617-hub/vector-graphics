package com.svgplatform.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 发布作品的请求体。
 */
@Data
public class PostCreateRequest implements Serializable {

    /** 标题，1-100 字 */
    @NotBlank(message = "标题不能为空")
    @Size(min = 1, max = 100, message = "标题长度需在 1-100 之间")
    private String title;

    /** 描述，选填，最多 2000 字 */
    @Size(max = 2000, message = "描述最多 2000 字")
    private String description;

    /** 关联的文件 ID 列表（来自"我的文件"），至少 1 个，最多 9 个 */
    @NotEmpty(message = "至少选择一个文件")
    @Size(min = 1, max = 9, message = "最多选择 9 个文件")
    private List<Long> fileIds;

    /** 标签名列表，选填，最多 5 个 */
    @Size(max = 5, message = "最多 5 个标签")
    private List<String> tags;
}