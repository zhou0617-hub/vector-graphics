package com.svgplatform.modules.file.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("files")
public class FileEntity implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String name;
    private String originalUrl;
    private String svgUrl;
    private String format;
    private Long size;
    private Integer width;
    private Integer height;
    private String status;
    private LocalDateTime createdAt;
}
