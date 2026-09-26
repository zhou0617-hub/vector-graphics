package com.svgplatform.modules.community.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.common.response.PageResponse;
import com.svgplatform.modules.community.dto.PostResponse;
import com.svgplatform.modules.community.dto.TagResponse;
import com.svgplatform.modules.community.dto.UserBriefResponse;
import com.svgplatform.modules.community.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 社区搜索接口。
 * <p>
 * 全部公开（未登录可搜索）。
 */
@RestController
@RequestMapping("/api/community/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * 搜索作品。
     *
     * @param q              关键词
     * @param includeTagIds  包含标签（逗号分隔，如 1,2）
     * @param excludeTagIds  排除标签（逗号分隔，如 3,4）
     */
    @GetMapping("/posts")
    public ApiResponse<PageResponse<PostResponse>> posts(
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "includeTagIds", required = false) List<Long> includeTagIds,
            @RequestParam(value = "excludeTagIds", required = false) List<Long> excludeTagIds,
            @RequestParam(value = "range", required = false, defaultValue = "all") String range,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.success(
                searchService.searchPosts(q, includeTagIds, excludeTagIds, range, source, page, size));
    }

    /** 搜索用户 */
    @GetMapping("/users")
    public ApiResponse<PageResponse<UserBriefResponse>> users(
            @RequestParam("q") String q,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.success(searchService.searchUsers(q, page, size));
    }

    /** 搜索标签 */
    @GetMapping("/tags")
    public ApiResponse<List<TagResponse>> tags(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {
        return ApiResponse.success(searchService.searchTags(q, limit));
    }
}