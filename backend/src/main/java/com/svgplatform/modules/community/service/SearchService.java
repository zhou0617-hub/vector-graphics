package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.svgplatform.common.response.PageResponse;
import com.svgplatform.modules.community.converter.PostConverter;
import com.svgplatform.modules.community.dto.PostResponse;
import com.svgplatform.modules.community.dto.TagResponse;
import com.svgplatform.modules.community.dto.UserBriefResponse;
import com.svgplatform.modules.community.entity.Post;
import com.svgplatform.modules.community.entity.PostTag;
import com.svgplatform.modules.community.entity.Tag;
import com.svgplatform.modules.community.repository.PostMapper;
import com.svgplatform.modules.community.repository.PostTagMapper;
import com.svgplatform.modules.community.repository.TagMapper;
import com.svgplatform.modules.user.entity.User;
import com.svgplatform.modules.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 社区搜索业务逻辑。
 * <p>
 * 三类搜索：作品（标题+描述）、用户（用户名）、标签（名称）。
 * 全部使用 LIKE 模糊匹配；数据量大后可换 Elasticsearch。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MAX_PAGE_SIZE = 60;
    private static final int MAX_TAG_LIMIT = 50;

    private final PostMapper postMapper;
    private final TagMapper tagMapper;
    private final PostTagMapper postTagMapper;
    private final UserMapper userMapper;

    /**
     * 搜索作品。
     */
    public PageResponse<PostResponse> searchPosts(String q, int page, int size) {
        String kw = normalize(q);
        if (kw.isEmpty()) {
            return PageResponse.of(List.of(), 0, Math.max(1, page), Math.min(Math.max(1, size), MAX_PAGE_SIZE));
        }
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Post> pager = new Page<>(p, s);
        LambdaQueryWrapper<Post> qw = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "normal")
                .and(w -> w.like(Post::getTitle, kw).or().like(Post::getDescription, kw))
                .orderByDesc(Post::getCreatedAt);

        Page<Post> result = postMapper.selectPage(pager, qw);
        return PageResponse.of(enrichPosts(result.getRecords()), result.getTotal(), p, s);
    }

    /**
     * 搜索用户。
     */
    public PageResponse<UserBriefResponse> searchUsers(String q, int page, int size) {
        String kw = normalize(q);
        if (kw.isEmpty()) {
            return PageResponse.of(List.of(), 0, Math.max(1, page), Math.min(Math.max(1, size), MAX_PAGE_SIZE));
        }
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<User> pager = new Page<>(p, s);
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<User>()
                .like(User::getUsername, kw)
                .orderByDesc(User::getId);

        Page<User> result = userMapper.selectPage(pager, qw);
        List<UserBriefResponse> items = result.getRecords().stream().map(u -> {
            UserBriefResponse r = new UserBriefResponse();
            r.setId(u.getId());
            r.setUsername(u.getUsername());
            r.setAvatarUrl(u.getAvatarUrl());
            r.setBio(u.getBio());
            return r;
        }).toList();
        return PageResponse.of(items, result.getTotal(), p, s);
    }

    /**
     * 搜索标签（按引用次数降序）。
     */
    public List<TagResponse> searchTags(String q, int limit) {
        String kw = normalize(q);
        if (kw.isEmpty()) return List.of();
        int l = Math.min(Math.max(1, limit), MAX_TAG_LIMIT);

        List<Tag> tags = tagMapper.selectList(
                new LambdaQueryWrapper<Tag>()
                        .like(Tag::getName, kw)
                        .orderByDesc(Tag::getUsageCount)
                        .last("LIMIT " + l));
        return tags.stream().map(PostConverter::toTagResponse).toList();
    }

    // ==================== 内部工具 ====================

    private String normalize(String q) {
        return q == null ? "" : q.trim();
    }

    /** 批量补全作者信息和标签 */
    private List<PostResponse> enrichPosts(List<Post> posts) {
        if (posts.isEmpty()) return List.of();

        Set<Long> userIds = posts.stream().map(Post::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, List<Tag>> tagMap = loadTagsByPostIds(postIds);

        return posts.stream().map(p -> PostConverter.toResponse(
                p,
                userMap.get(p.getUserId()),
                tagMap.getOrDefault(p.getId(), List.of())
        )).toList();
    }

    private Map<Long, List<Tag>> loadTagsByPostIds(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        List<PostTag> relations = postTagMapper.selectList(
                new LambdaQueryWrapper<PostTag>().in(PostTag::getPostId, postIds));
        if (relations.isEmpty()) return Map.of();

        Set<Long> tagIds = relations.stream().map(PostTag::getTagId).collect(Collectors.toSet());
        Map<Long, Tag> tagMap = tagMapper.selectBatchIds(tagIds).stream()
                .collect(Collectors.toMap(Tag::getId, t -> t));

        Map<Long, List<Tag>> result = new HashMap<>();
        for (PostTag rel : relations) {
            Tag t = tagMap.get(rel.getTagId());
            if (t != null) {
                result.computeIfAbsent(rel.getPostId(), k -> new ArrayList<>()).add(t);
            }
        }
        return result;
    }
}