package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 作品与标签的关联实体，对应 post_tags 表。
 * <p>
 * 一个作品可有多个标签，一个标签可属于多个作品。
 * post_id + tag_id 已有唯一索引，保证不重复关联。
 */
@Data
@TableName("post_tags")
public class PostTag implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作品 ID */
    private Long postId;

    /** 标签 ID */
    private Long tagId;
}