package com.svgplatform.modules.conversion.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.conversion.entity.Conversion;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConversionMapper extends BaseMapper<Conversion> {
}
