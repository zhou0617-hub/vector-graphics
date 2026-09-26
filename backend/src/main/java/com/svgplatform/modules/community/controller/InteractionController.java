package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.community.service.InteractionService;
import com.svgplatform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 互动接口：点赞、收藏。
 */
@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping("/{id}/like")
    public ApiResponse<Void> like(@PathVariable("id") Long id) {
        interactionService.like(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlike(@PathVariable("id") Long id) {
        interactionService.unlike(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    /**
     * 收藏（可指定收藏夹）。
     * @param folderId 收藏夹 ID，缺省表示默认收藏夹
     */
    @PostMapping("/{id}/favorite")
    public ApiResponse<Void> favorite(
            @PathVariable("id") Long id,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        interactionService.favorite(SecurityUtils.currentUserId(), id, folderId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/favorite")
    public ApiResponse<Void> unfavorite(@PathVariable("id") Long id) {
        interactionService.unfavorite(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }
}