package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.PostTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 作品-标签关联数据访问层。
 */
@Mapper
public interface PostTagMapper extends BaseMapper<PostTag> {
}