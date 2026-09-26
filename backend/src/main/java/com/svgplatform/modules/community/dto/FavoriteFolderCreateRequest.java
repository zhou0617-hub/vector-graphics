package com.svgplatform.modules.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * 创建/编辑收藏夹请求体。
 */
@Data
public class FavoriteFolderCreateRequest implements Serializable {

    @NotBlank(message = "收藏夹名称不能为空")
    @Size(min = 1, max = 64, message = "名称长度需在 1-64 之间")
    private String name;

    @Size(max = 512, message = "描述最多 512 字")
    private String description;

    /** 是否公开 */
    private Boolean isPublic;
}