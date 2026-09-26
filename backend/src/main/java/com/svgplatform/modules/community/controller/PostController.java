package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.common.response.PageResponse;
import com.svgplatform.modules.community.dto.*;
import com.svgplatform.modules.community.service.PostService;
import com.svgplatform.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 社区作品接口。
 * <p>
 * 读接口（列表、详情、排行）对未登录用户开放；
 * 写接口（发布、编辑、删除）需登录，且仅能操作自己的作品。
 */
@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ==================== 读接口 ====================

    /**
     * 广场作品列表。
     *
     * @param sort 排序：latest / like / comment / favorite / hot
     */
    @GetMapping
    public ApiResponse<PageResponse<PostResponse>> list(
            @RequestParam(value = "sort", required = false, defaultValue = "latest") String sort,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size,
            @RequestParam(value = "tagId", required = false) Long tagId) {
        return ApiResponse.success(postService.list(sort, page, size, tagId));
    }

    /**
     * 热度排行。
     *
     * @param period day / week / month / year / all
     */
    @GetMapping("/ranking")
    public ApiResponse<List<PostResponse>> ranking(
            @RequestParam(value = "period", required = false, defaultValue = "day") String period,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {
        return ApiResponse.success(postService.ranking(period, limit));
    }

    /**
     * 作品详情。
     */
    @GetMapping("/{id}")
    public ApiResponse<PostDetailResponse> detail(@PathVariable("id") Long id) {
        return ApiResponse.success(postService.getDetail(currentUserIdOrNull(), id));
    }

    /**
     * 带筛选的作品列表（图3/4/5 用）。
     *
     * @param sort    排序字段：latest / like / comment / favorite / view
     * @param order   排序方向：asc / desc
     * @param range   时间范围：today / week / month / year / all
     * @param tagId   标签过滤
     * @param source  来源过滤：convert / upscale
     */
    @GetMapping("/search")
    public ApiResponse<PageResponse<PostResponse>> search(
            @RequestParam(value = "sort", required = false, defaultValue = "latest") String sort,
            @RequestParam(value = "order", required = false, defaultValue = "desc") String order,
            @RequestParam(value = "range", required = false, defaultValue = "all") String range,
            @RequestParam(value = "tagId", required = false) Long tagId,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "24") int size) {
        return ApiResponse.success(
                postService.searchPaged(sort, order, range, tagId, source, page, size));
    }

    /**
     * 随机取一个作品 ID。返回 null 表示社区暂无作品。
     */
    @GetMapping("/random")
    public ApiResponse<Long> random() {
        return ApiResponse.success(postService.randomPostId());
    }

    /**
     * 某用户的统计数字（作品/点赞/收藏/评论总数）。
     */
    @GetMapping("/user/{userId}/stats")
    public ApiResponse<com.svgplatform.modules.community.dto.UserStatsResponse> userStats(
            @PathVariable("userId") Long userId) {
        return ApiResponse.success(postService.getUserStats(userId));
    }

    /**
     * 某用户的作品列表。
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<PageResponse<PostResponse>> listByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.success(postService.listByUser(userId, page, size));
    }

    /**
     * 某用户点赞过的帖子。
     */
    @GetMapping("/user/{userId}/liked")
    public ApiResponse<PageResponse<PostResponse>> listLikedByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.success(postService.listLikedByUser(userId, page, size));
    }

    /**
     * 某用户收藏过的帖子。
     */
    @GetMapping("/user/{userId}/favorited")
    public ApiResponse<PageResponse<PostResponse>> listFavoritedByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "all", required = false, defaultValue = "false") boolean all,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        // all=true 时返回所有收藏（不分收藏夹）；否则按 folderId 查询（folderId=null 表示默认收藏夹）
        if (all) {
            return ApiResponse.success(postService.listFavoritedByUser(userId, page, size));
        }
        return ApiResponse.success(postService.listFavoritedByUserInFolder(userId, folderId, page, size));
    }

    /**
     * 某用户发表的评论。
     */
    @GetMapping("/user/{userId}/comments")
    public ApiResponse<PageResponse<com.svgplatform.modules.community.dto.UserCommentResponse>> listCommentsByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.success(postService.listCommentsByUser(userId, page, size));
    }

    // ==================== 写接口 ====================

    /**
     * 发布作品。
     */
    @PostMapping
    public ApiResponse<PostDetailResponse> create(@Valid @RequestBody PostCreateRequest req) {
        return ApiResponse.success(postService.create(SecurityUtils.currentUserId(), req));
    }

    /**
     * 编辑作品。
     */
    @PatchMapping("/{id}")
    public ApiResponse<PostDetailResponse> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody PostUpdateRequest req) {
        return ApiResponse.success(postService.update(SecurityUtils.currentUserId(), id, req));
    }

    /**
     * 浏览量 +1。前端详情页挂载时调用一次。无需登录。
     */
    @PostMapping("/{id}/view")
    public ApiResponse<Void> view(@PathVariable("id") Long id) {
        postService.incrementView(id);
        return ApiResponse.success();
    }

    /**
     * 删除作品（软删除）。
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        postService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    // ==================== 内部工具 ====================

    /**
     * 尝试取当前登录用户 ID；未登录返回 null。
     * 用于详情接口需要区分"未登录"和"已登录"的场景。
     */
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