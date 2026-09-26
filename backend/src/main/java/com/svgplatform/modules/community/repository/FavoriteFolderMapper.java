package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.FavoriteFolder;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收藏夹数据访问层。
 */
@Mapper
public interface FavoriteFolderMapper extends BaseMapper<FavoriteFolder> {
}