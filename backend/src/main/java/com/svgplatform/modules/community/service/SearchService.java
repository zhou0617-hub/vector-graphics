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
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 社区搜索业务逻辑。
 * <p>
 * 作品搜索支持：关键词（标题/描述 LIKE）+ 包含标签（多选 OR）+ 排除标签（多选）。
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
     *
     * @param q              关键词（标题/描述模糊匹配）
     * @param includeTagIds  包含标签 ID 列表（OR 关系，作品有其中之一即命中）
     * @param excludeTagIds  排除标签 ID 列表（作品有其中之一则剔除）
     */
    public PageResponse<PostResponse> searchPosts(String q, List<Long> includeTagIds,
                                                  List<Long> excludeTagIds, String range,
                                                  String source, int page, int size) {
        String kw = normalize(q);
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        // 关键词、标签、时间范围、来源 至少要有一个，否则返回空
        boolean hasFilter = !kw.isEmpty()
                || (includeTagIds != null && !includeTagIds.isEmpty())
                || (excludeTagIds != null && !excludeTagIds.isEmpty())
                || (range != null && !range.equals("all"));
        if (!hasFilter) {
            return PageResponse.of(List.of(), 0, p, s);
        }

        LambdaQueryWrapper<Post> qw = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "normal");

        if (!kw.isEmpty()) {
            qw.and(w -> w.like(Post::getTitle, kw).or().like(Post::getDescription, kw));
        }

        // 时间范围
        LocalDateTime since = switch (range == null ? "all" : range) {
            case "today" -> LocalDateTime.now().toLocalDate().atStartOfDay();
            case "week"  -> LocalDateTime.now().minusDays(7);
            case "month" -> LocalDateTime.now().minusDays(30);
            case "year"  -> LocalDateTime.now().minusDays(365);
            default      -> null;
        };
        if (since != null) {
            qw.ge(Post::getCreatedAt, since);
        }

        // 来源过滤：通过 post_files.source 子查询
        if (source != null && !source.isEmpty()) {
            // 用 inSql 生成子查询
            qw.inSql(Post::getId,
                "SELECT post_id FROM post_files WHERE source = '" + source.replace("'", "''") + "'");
        }

        // 包含标签：作品必须有其中至少一个
        if (includeTagIds != null && !includeTagIds.isEmpty()) {
            List<Long> includePostIds = postTagMapper.selectList(
                    new LambdaQueryWrapper<PostTag>().in(PostTag::getTagId, includeTagIds))
                    .stream().map(PostTag::getPostId).distinct().toList();
            if (includePostIds.isEmpty()) {
                return PageResponse.of(List.of(), 0, p, s);
            }
            qw.in(Post::getId, includePostIds);
        }

        // 排除标签：作品有其中任意一个则剔除
        if (excludeTagIds != null && !excludeTagIds.isEmpty()) {
            List<Long> excludePostIds = postTagMapper.selectList(
                    new LambdaQueryWrapper<PostTag>().in(PostTag::getTagId, excludeTagIds))
                    .stream().map(PostTag::getPostId).distinct().toList();
            if (!excludePostIds.isEmpty()) {
                qw.notIn(Post::getId, excludePostIds);
            }
        }

        qw.orderByDesc(Post::getCreatedAt);

        Page<Post> pager = new Page<>(p, s);
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