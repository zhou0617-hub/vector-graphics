package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.Favorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收藏记录数据访问层。
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {
}