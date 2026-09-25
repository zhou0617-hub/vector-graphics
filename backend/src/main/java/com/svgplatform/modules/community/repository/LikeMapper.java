package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.Like;
import org.apache.ibatis.annotations.Mapper;

/**
 * 点赞记录数据访问层。
 */
@Mapper
public interface LikeMapper extends BaseMapper<Like> {
}