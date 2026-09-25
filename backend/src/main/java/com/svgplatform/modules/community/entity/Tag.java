package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 标签实体，对应 tags 表。
 * <p>
 * 用户发布作品时可输入任意标签，不存在则自动创建。
 * usage_count 用于热门标签排序，避免每次 JOIN post_tags 统计。
 */
@Data
@TableName("tags")
public class Tag implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 标签显示名（唯一），例如 "风景" */
    private String name;

    /** URL 短名（唯一），例如 "landscape" */
    private String slug;

    /** 被引用次数（冗余） */
    private Integer usageCount;

    /** 创建时间 */
    private LocalDateTime createdAt;
}