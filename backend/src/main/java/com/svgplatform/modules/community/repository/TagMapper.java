package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.Tag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 标签数据访问层。
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
}