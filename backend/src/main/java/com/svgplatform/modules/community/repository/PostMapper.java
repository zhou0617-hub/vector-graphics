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
 * 除 MyBatis-Plus 提供的基础 CRUD 外，额外提供热度排行查询。
 */
@Mapper
public interface PostMapper extends BaseMapper<Post> {

    /**
     * 按热度排行查询作品。
     * <p>
     * 热度公式：点赞数 × 3 + 收藏数 × 5 + 评论数 × 4。
     * 仅统计 created_at 在 since 之后的互动记录。
     * 总榜可将 since 传为 '1970-01-01'。
     *
     * @param since 统计起始时间
     * @param limit 返回条数上限
     * @return 按热度降序排列的作品列表
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
}