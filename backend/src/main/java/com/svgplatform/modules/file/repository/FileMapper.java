package com.svgplatform.modules.file.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.file.entity.FileEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FileMapper extends BaseMapper<FileEntity> {
}
