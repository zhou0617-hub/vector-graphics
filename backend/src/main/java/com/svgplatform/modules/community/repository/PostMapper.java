package com.svgplatform.modules.community.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.svgplatform.modules.community.entity.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 社区作品数据访问层。
 * <p>
 * 除 MyBatis-Plus 基础 CRUD 外，提供：
 * 热度排行、随机作品、带筛选的分页搜索。
 */
@Mapper
public interface PostMapper extends BaseMapper<Post> {

    /**
     * 按热度排行查询作品。
     * 热度公式：点赞 × 3 + 收藏 × 5 + 评论 × 4。
     */
    @Select("""
            SELECT p.* FROM posts p
            WHERE p.status = 'normal'
            ORDER BY (
                COALESCE((SELECT COUNT(*) FROM likes     WHERE post_id = p.id AND created_at >= #{since}), 0) * 3 +
                COALESCE((SELECT COUNT(*) FROM favorites WHERE post_id = p.id AND created_at >= #{since}), 0) * 5 +
                COALESCE((SELECT COUNT(*) FROM comments  WHERE post_id = p.id AND created_at >= #{since}), 0) * 4
            ) DESC, p.created_at DESC
            LIMIT #{limit}
            """)
    List<Post> selectRanking(@Param("since") LocalDateTime since, @Param("limit") int limit);

    /**
     * 随机取一个 normal 状态的作品 ID。
     */
    @Select("SELECT id FROM posts WHERE status = 'normal' ORDER BY RAND() LIMIT 1")
    Long selectRandomId();

    /**
     * 带筛选的作品分页查询（SQL 在 mapper/PostMapper.xml）。
     */
    List<Post> selectSearchPage(@Param("sort") String sort,
                                @Param("order") String order,
                                @Param("since") LocalDateTime since,
                                @Param("tagId") Long tagId,
                                @Param("source") String source,
                                @Param("offset") int offset,
                                @Param("limit") int limit);

    /**
     * 带筛选的作品总数。
     */
    long countSearchPage(@Param("since") LocalDateTime since,
                         @Param("tagId") Long tagId,
                         @Param("source") String source);
}