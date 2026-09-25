package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.PostFile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 作品-文件关联数据访问层。
 */
@Mapper
public interface PostFileMapper extends BaseMapper<PostFile> {
}