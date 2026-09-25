package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.modules.community.entity.Favorite;
import com.svgplatform.modules.community.entity.Like;
import com.svgplatform.modules.community.entity.Post;
import com.svgplatform.modules.community.repository.FavoriteMapper;
import com.svgplatform.modules.community.repository.LikeMapper;
import com.svgplatform.modules.community.repository.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 互动业务逻辑：点赞、收藏。
 * <p>
 * 幂等设计：重复点赞不报错、重复取消不报错。
 * 每次成功变更同步更新 posts 表对应计数器的冗余字段。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionService {

    private final LikeMapper likeMapper;
    private final FavoriteMapper favoriteMapper;
    private final PostMapper postMapper;

    // ==================== 点赞 ====================

    /**
     * 点赞。已点过则直接返回，不报错。
     */
    @Transactional
    public void like(Long userId, Long postId) {
        ensurePostExists(postId);

        Long count = likeMapper.selectCount(
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getPostId, postId)
                        .eq(Like::getUserId, userId));
        if (count != null && count > 0) {
            return; // 幂等
        }

        Like like = new Like();
        like.setPostId(postId);
        like.setUserId(userId);
        likeMapper.insert(like);

        postMapper.update(null,
                new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("like_count = like_count + 1"));
    }

    /**
     * 取消点赞。未点过则直接返回。
     */
    @Transactional
    public void unlike(Long userId, Long postId) {
        ensurePostExists(postId);

        int deleted = likeMapper.delete(
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getPostId, postId)
                        .eq(Like::getUserId, userId));
        if (deleted > 0) {
            postMapper.update(null,
                    new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Post>()
                            .eq(Post::getId, postId)
                            .setSql("like_count = GREATEST(like_count - 1, 0)"));
        }
    }

    // ==================== 收藏 ====================

    @Transactional
    public void favorite(Long userId, Long postId) {
        ensurePostExists(postId);

        Long count = favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getPostId, postId)
                        .eq(Favorite::getUserId, userId));
        if (count != null && count > 0) {
            return;
        }

        Favorite fav = new Favorite();
        fav.setPostId(postId);
        fav.setUserId(userId);
        favoriteMapper.insert(fav);

        postMapper.update(null,
                new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("favorite_count = favorite_count + 1"));
    }

    @Transactional
    public void unfavorite(Long userId, Long postId) {
        ensurePostExists(postId);

        int deleted = favoriteMapper.delete(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getPostId, postId)
                        .eq(Favorite::getUserId, userId));
        if (deleted > 0) {
            postMapper.update(null,
                    new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Post>()
                            .eq(Post::getId, postId)
                            .setSql("favorite_count = GREATEST(favorite_count - 1, 0)"));
        }
    }

    // ==================== 内部工具 ====================

    private void ensurePostExists(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }
    }
}