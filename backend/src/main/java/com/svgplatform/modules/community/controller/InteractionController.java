package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.community.service.InteractionService;
import com.svgplatform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 互动接口：点赞、收藏。
 * <p>
 * 全部需要登录。四个接口都是幂等的。
 */
@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    /** 点赞 */
    @PostMapping("/{id}/like")
    public ApiResponse<Void> like(@PathVariable("id") Long id) {
        interactionService.like(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    /** 取消点赞 */
    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlike(@PathVariable("id") Long id) {
        interactionService.unlike(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    /** 收藏 */
    @PostMapping("/{id}/favorite")
    public ApiResponse<Void> favorite(@PathVariable("id") Long id) {
        interactionService.favorite(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    /** 取消收藏 */
    @DeleteMapping("/{id}/favorite")
    public ApiResponse<Void> unfavorite(@PathVariable("id") Long id) {
        interactionService.unfavorite(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }
}