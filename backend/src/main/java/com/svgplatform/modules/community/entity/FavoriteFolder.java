package com.svgplatform.modules.community.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 收藏夹实体。
 * <p>
 * 用户可创建多个收藏夹，将收藏的作品归类。
 * item_count 为冗余字段，收藏/取消收藏时同步更新。
 */
@Data
@TableName("favorite_folders")
public class FavoriteFolder implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属用户 ID */
    private Long userId;

    /** 收藏夹名称（同一用户下唯一） */
    private String name;

    /** 描述 */
    private String description;

    /** 是否公开：0=私密 1=公开 */
    private Integer isPublic;

    /** 收藏数（冗余） */
    private Integer itemCount;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;
}