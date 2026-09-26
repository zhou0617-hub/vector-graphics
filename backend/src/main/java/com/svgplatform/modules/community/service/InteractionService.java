package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.modules.community.entity.Favorite;
import com.svgplatform.modules.community.entity.FavoriteFolder;
import com.svgplatform.modules.community.entity.Like;
import com.svgplatform.modules.community.entity.Post;
import com.svgplatform.modules.community.repository.FavoriteFolderMapper;
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
 * 收藏支持指定收藏夹（folderId 为 null 表示默认收藏夹）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionService {

    private final LikeMapper likeMapper;
    private final FavoriteMapper favoriteMapper;
    private final FavoriteFolderMapper folderMapper;
    private final PostMapper postMapper;

    // ==================== 点赞 ====================

    @Transactional
    public void like(Long userId, Long postId) {
        ensurePostExists(postId);

        Long count = likeMapper.selectCount(
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getPostId, postId)
                        .eq(Like::getUserId, userId));
        if (count != null && count > 0) return;

        Like like = new Like();
        like.setPostId(postId);
        like.setUserId(userId);
        likeMapper.insert(like);

        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("like_count = like_count + 1"));
    }

    @Transactional
    public void unlike(Long userId, Long postId) {
        ensurePostExists(postId);
        int deleted = likeMapper.delete(
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getPostId, postId)
                        .eq(Like::getUserId, userId));
        if (deleted > 0) {
            postMapper.update(null,
                    new LambdaUpdateWrapper<Post>()
                            .eq(Post::getId, postId)
                            .setSql("like_count = GREATEST(like_count - 1, 0)"));
        }
    }

    // ==================== 收藏 ====================

    /**
     * 收藏（可指定收藏夹）。
     * <p>
     * 已收藏则只更新收藏夹归属，不重复计数。
     */
    @Transactional
    public void favorite(Long userId, Long postId, Long folderId) {
        ensurePostExists(postId);

        // 校验收藏夹归属
        if (folderId != null) {
            FavoriteFolder folder = folderMapper.selectById(folderId);
            if (folder == null || !folder.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "收藏夹不存在");
            }
        }

        // 查已有收藏
        Favorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getPostId, postId)
                        .eq(Favorite::getUserId, userId)
                        .last("LIMIT 1"));

        if (existing != null) {
            // 已收藏，更新归属
            Long oldFolderId = existing.getFolderId();
            if (oldFolderId != null && !oldFolderId.equals(folderId)) {
                // 老夹 -1
                folderMapper.update(null,
                        new LambdaUpdateWrapper<FavoriteFolder>()
                                .eq(FavoriteFolder::getId, oldFolderId)
                                .setSql("item_count = GREATEST(item_count - 1, 0)"));
            }
            if (folderId != null && !folderId.equals(oldFolderId)) {
                // 新夹 +1
                folderMapper.update(null,
                        new LambdaUpdateWrapper<FavoriteFolder>()
                                .eq(FavoriteFolder::getId, folderId)
                                .setSql("item_count = item_count + 1"));
            }
            existing.setFolderId(folderId);
            favoriteMapper.updateById(existing);
            return;
        }

        // 新收藏
        Favorite fav = new Favorite();
        fav.setPostId(postId);
        fav.setUserId(userId);
        fav.setFolderId(folderId);
        favoriteMapper.insert(fav);

        if (folderId != null) {
            folderMapper.update(null,
                    new LambdaUpdateWrapper<FavoriteFolder>()
                            .eq(FavoriteFolder::getId, folderId)
                            .setSql("item_count = item_count + 1"));
        }

        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("favorite_count = favorite_count + 1"));
    }

    @Transactional
    public void unfavorite(Long userId, Long postId) {
        ensurePostExists(postId);

        Favorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getPostId, postId)
                        .eq(Favorite::getUserId, userId)
                        .last("LIMIT 1"));
        if (existing == null) return;

        if (existing.getFolderId() != null) {
            folderMapper.update(null,
                    new LambdaUpdateWrapper<FavoriteFolder>()
                            .eq(FavoriteFolder::getId, existing.getFolderId())
                            .setSql("item_count = GREATEST(item_count - 1, 0)"));
        }

        favoriteMapper.deleteById(existing.getId());

        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("favorite_count = GREATEST(favorite_count - 1, 0)"));
    }

    private void ensurePostExists(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }
    }
}