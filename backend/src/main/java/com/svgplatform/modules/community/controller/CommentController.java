package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.community.dto.CommentCreateRequest;
import com.svgplatform.modules.community.dto.CommentResponse;
import com.svgplatform.modules.community.service.CommentService;
import com.svgplatform.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 评论接口。
 * <p>
 * 列表接口公开（未登录可看），发表和删除需要登录。
 */
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** 发表评论（含回复） */
    @PostMapping("/posts/{id}/comments")
    public ApiResponse<CommentResponse> create(
            @PathVariable("id") Long postId,
            @Valid @RequestBody CommentCreateRequest req) {
        return ApiResponse.success(
                commentService.create(SecurityUtils.currentUserId(), postId, req));
    }

    /** 评论列表（两级结构，公开） */
    @GetMapping("/posts/{id}/comments")
    public ApiResponse<List<CommentResponse>> list(@PathVariable("id") Long postId) {
        return ApiResponse.success(
                commentService.listByPost(currentUserIdOrNull(), postId));
    }

    /** 删除自己的评论 */
    @DeleteMapping("/comments/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long commentId) {
        commentService.delete(SecurityUtils.currentUserId(), commentId);
        return ApiResponse.success();
    }

    /** 尝试取当前登录用户 ID；未登录返回 null */
    private Long currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof com.svgplatform.security.UserPrincipal p) {
            return p.getId();
        }
        return null;
    }
}