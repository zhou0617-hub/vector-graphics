package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 评论数据访问层。
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}