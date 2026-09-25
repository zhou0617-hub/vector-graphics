package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 作品与文件的关联实体，对应 post_files 表。
 * <p>
 * 发布作品时，会把源文件（files 表）的关键信息复制一份存到这里，
 * 保证即使源文件被删除，作品仍能正常展示。
 * file_id 仅作溯源用，业务展示一律以 url / name 等快照字段为准。
 */
@Data
@TableName("post_files")
public class PostFile implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关联的作品 ID */
    private Long postId;

    /** 源文件 ID（仅溯源，可能已被删除） */
    private Long fileId;

    /** 文件名快照 */
    private String name;

    /** 图片 URL 快照 */
    private String url;

    /** 格式快照：PNG / SVG 等 */
    private String format;

    /** 宽（像素） */
    private Integer width;

    /** 高（像素） */
    private Integer height;

    /** 文件大小（字节） */
    private Long size;

    /** 来源：convert / upscale */
    private String source;

    /** 展示顺序，越小越靠前 */
    private Integer sortOrder;
}