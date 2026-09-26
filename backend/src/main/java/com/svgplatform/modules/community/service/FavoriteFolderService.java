package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.modules.community.dto.FavoriteFolderCreateRequest;
import com.svgplatform.modules.community.dto.FavoriteFolderResponse;
import com.svgplatform.modules.community.entity.Favorite;
import com.svgplatform.modules.community.entity.FavoriteFolder;
import com.svgplatform.modules.community.repository.FavoriteFolderMapper;
import com.svgplatform.modules.community.repository.FavoriteMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 收藏夹业务逻辑。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteFolderService {

    private final FavoriteFolderMapper folderMapper;
    private final FavoriteMapper favoriteMapper;

    /**
     * 列出某用户的全部收藏夹（按创建时间倒序）。
     */
    public List<FavoriteFolderResponse> listByUser(Long userId) {
        List<FavoriteFolder> folders = folderMapper.selectList(
                new LambdaQueryWrapper<FavoriteFolder>()
                        .eq(FavoriteFolder::getUserId, userId)
                        .orderByDesc(FavoriteFolder::getCreatedAt));
        return folders.stream().map(this::toResponse).toList();
    }

    /**
     * 创建收藏夹。同一用户名下不能重名。
     */
    @Transactional
    public FavoriteFolderResponse create(Long userId, FavoriteFolderCreateRequest req) {
        // 重名检查
        Long exists = folderMapper.selectCount(
                new LambdaQueryWrapper<FavoriteFolder>()
                        .eq(FavoriteFolder::getUserId, userId)
                        .eq(FavoriteFolder::getName, req.getName().trim()));
        if (exists != null && exists > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "已存在同名收藏夹");
        }

        FavoriteFolder folder = new FavoriteFolder();
        folder.setUserId(userId);
        folder.setName(req.getName().trim());
        folder.setDescription(req.getDescription());
        folder.setIsPublic(Boolean.TRUE.equals(req.getIsPublic()) ? 1 : 0);
        folder.setItemCount(0);
        folderMapper.insert(folder);

        return toResponse(folder);
    }

    /**
     * 编辑收藏夹。
     */
    @Transactional
    public FavoriteFolderResponse update(Long userId, Long folderId, FavoriteFolderCreateRequest req) {
        FavoriteFolder folder = folderMapper.selectById(folderId);
        if (folder == null || !folder.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "收藏夹不存在");
        }

        // 重名检查（排除自己）
        Long exists = folderMapper.selectCount(
                new LambdaQueryWrapper<FavoriteFolder>()
                        .eq(FavoriteFolder::getUserId, userId)
                        .eq(FavoriteFolder::getName, req.getName().trim())
                        .ne(FavoriteFolder::getId, folderId));
        if (exists != null && exists > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "已存在同名收藏夹");
        }

        folder.setName(req.getName().trim());
        folder.setDescription(req.getDescription());
        folder.setIsPublic(Boolean.TRUE.equals(req.getIsPublic()) ? 1 : 0);
        folderMapper.updateById(folder);

        return toResponse(folder);
    }

    /**
     * 删除收藏夹。
     * 夹内收藏全部归到默认收藏夹（folder_id = null）。
     */
    @Transactional
    public void delete(Long userId, Long folderId) {
        FavoriteFolder folder = folderMapper.selectById(folderId);
        if (folder == null || !folder.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "收藏夹不存在");
        }

        // 夹内收藏归到默认
        favoriteMapper.update(null,
                new LambdaUpdateWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .eq(Favorite::getFolderId, folderId)
                        .set(Favorite::getFolderId, null));

        folderMapper.deleteById(folderId);
    }

    // ==================== 内部 ====================

    private FavoriteFolderResponse toResponse(FavoriteFolder f) {
        FavoriteFolderResponse r = new FavoriteFolderResponse();
        r.setId(f.getId());
        r.setName(f.getName());
        r.setDescription(f.getDescription());
        r.setIsPublic(f.getIsPublic() != null && f.getIsPublic() == 1);
        r.setItemCount(f.getItemCount());
        r.setCreatedAt(f.getCreatedAt());
        return r;
    }
}