package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.community.dto.FavoriteFolderCreateRequest;
import com.svgplatform.modules.community.dto.FavoriteFolderResponse;
import com.svgplatform.modules.community.service.FavoriteFolderService;
import com.svgplatform.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 收藏夹接口。
 */
@RestController
@RequestMapping("/api/community/favorite-folders")
@RequiredArgsConstructor
public class FavoriteFolderController {

    private final FavoriteFolderService folderService;

    /** 列出当前用户的全部收藏夹 */
    @GetMapping
    public ApiResponse<List<FavoriteFolderResponse>> list() {
        return ApiResponse.success(folderService.listByUser(SecurityUtils.currentUserId()));
    }

    /** 创建收藏夹 */
    @PostMapping
    public ApiResponse<FavoriteFolderResponse> create(
            @Valid @RequestBody FavoriteFolderCreateRequest req) {
        return ApiResponse.success(folderService.create(SecurityUtils.currentUserId(), req));
    }

    /** 编辑收藏夹 */
    @PatchMapping("/{id}")
    public ApiResponse<FavoriteFolderResponse> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody FavoriteFolderCreateRequest req) {
        return ApiResponse.success(folderService.update(SecurityUtils.currentUserId(), id, req));
    }

    /** 删除收藏夹 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        folderService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }
}