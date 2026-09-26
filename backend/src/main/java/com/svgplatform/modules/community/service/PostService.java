package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.common.response.PageResponse;
import com.svgplatform.modules.community.converter.PostConverter;
import com.svgplatform.modules.community.dto.*;
import com.svgplatform.modules.community.entity.*;
import com.svgplatform.modules.community.repository.*;
import com.svgplatform.modules.community.repository.CommentMapper;
import com.svgplatform.modules.file.entity.FileEntity;
import com.svgplatform.modules.file.repository.FileMapper;
import com.svgplatform.modules.user.entity.User;
import com.svgplatform.modules.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 社区模块业务逻辑。
 * <p>
 * 覆盖作品的发布、编辑、删除、列表查询、详情查询和热度排行。
 * 详情接口会同步递增浏览量、返回当前用户的点赞/收藏状态。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private static final int MAX_PAGE_SIZE = 60;

    private final PostMapper postMapper;
    private final PostFileMapper postFileMapper;
    private final TagMapper tagMapper;
    private final PostTagMapper postTagMapper;
    private final LikeMapper likeMapper;
    private final FavoriteMapper favoriteMapper;
    private final CommentMapper commentMapper;
    private final FileMapper fileMapper;
    private final UserMapper userMapper;

    // ==================== 发布 ====================

    @Transactional
    public PostDetailResponse create(Long userId, PostCreateRequest req) {
        List<FileEntity> files = loadOwnedFiles(userId, req.getFileIds());

        Post post = new Post();
        post.setUserId(userId);
        post.setTitle(req.getTitle().trim());
        post.setDescription(req.getDescription());
        post.setCoverUrl(pickCoverUrl(files));
        post.setStatus("normal");
        post.setLikeCount(0);
        post.setFavoriteCount(0);
        post.setCommentCount(0);
        post.setViewCount(0);
        postMapper.insert(post);

        insertPostFiles(post.getId(), files);
        savePostTags(post.getId(), req.getTags());

        return getDetailWithoutViewIncrement(userId, post.getId());
    }

    // ==================== 编辑 ====================

    @Transactional
    public PostDetailResponse update(Long userId, Long postId, PostUpdateRequest req) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }
        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "只能编辑自己的作品");
        }

        List<FileEntity> files = loadOwnedFiles(userId, req.getFileIds());

        post.setTitle(req.getTitle().trim());
        post.setDescription(req.getDescription());
        post.setCoverUrl(pickCoverUrl(files));
        postMapper.updateById(post);

        postFileMapper.delete(new LambdaQueryWrapper<PostFile>().eq(PostFile::getPostId, postId));
        insertPostFiles(postId, files);

        postTagMapper.delete(new LambdaQueryWrapper<PostTag>().eq(PostTag::getPostId, postId));
        savePostTags(postId, req.getTags());

        return getDetailWithoutViewIncrement(userId, postId);
    }

    // ==================== 删除 ====================

    @Transactional
    public void delete(Long userId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }
        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "只能删除自己的作品");
        }
        post.setStatus("deleted");
        postMapper.updateById(post);
        log.info("作品软删除: postId={}, userId={}", postId, userId);
    }

    // ==================== 列表 ====================

    public PageResponse<PostResponse> list(String sort, int page, int size, Long tagId) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Post> pager = new Page<>(p, s);

        List<Long> filterPostIds = null;
        if (tagId != null) {
            filterPostIds = postTagMapper.selectList(
                    new LambdaQueryWrapper<PostTag>().eq(PostTag::getTagId, tagId)
            ).stream().map(PostTag::getPostId).toList();
            if (filterPostIds.isEmpty()) {
                return PageResponse.of(List.of(), 0, p, s);
            }
        }

        LambdaQueryWrapper<Post> qw = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, "normal");
        if (filterPostIds != null) {
            qw.in(Post::getId, filterPostIds);
        }

        switch (sort == null ? "latest" : sort) {
            case "like"     -> qw.orderByDesc(Post::getLikeCount).orderByDesc(Post::getCreatedAt);
            case "comment"  -> qw.orderByDesc(Post::getCommentCount).orderByDesc(Post::getCreatedAt);
            case "favorite" -> qw.orderByDesc(Post::getFavoriteCount).orderByDesc(Post::getCreatedAt);
            case "hot"      -> qw.orderByDesc(Post::getLikeCount).orderByDesc(Post::getViewCount);
            default         -> qw.orderByDesc(Post::getCreatedAt);
        }

        Page<Post> result = postMapper.selectPage(pager, qw);
        return PageResponse.of(enrichList(result.getRecords()), result.getTotal(), p, s);
    }

    public List<PostResponse> ranking(String period, int limit) {
        LocalDateTime since = switch (period == null ? "day" : period) {
            case "week"  -> LocalDateTime.now().minusDays(7);
            case "month" -> LocalDateTime.now().minusDays(30);
            case "year"  -> LocalDateTime.now().minusDays(365);
            case "all"   -> LocalDateTime.of(1970, 1, 1, 0, 0);
            default      -> LocalDateTime.now().minusDays(1);
        };
        int l = Math.min(Math.max(1, limit), 100);
        return enrichList(postMapper.selectRanking(since, l));
    }

    public PageResponse<PostResponse> listByUser(Long targetUserId, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Post> pager = new Page<>(p, s);
        Page<Post> result = postMapper.selectPage(pager,
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, "normal")
                        .eq(Post::getUserId, targetUserId)
                        .orderByDesc(Post::getCreatedAt));
        return PageResponse.of(enrichList(result.getRecords()), result.getTotal(), p, s);
    }

    // ==================== 详情 ====================

    /**
     * 作品详情（对外接口）。
     * <p>
     * 每次调用会把 view_count +1（不区分登录状态、不做去重）。
     * 返回的 viewCount 是 +1 后的值。
     */
    /**
     * 读取作品详情。纯读操作，不修改任何数据。
     * 浏览量自增请调用 incrementView。
     */
    public PostDetailResponse getDetail(Long currentUserId, Long postId) {
        return getDetailWithoutViewIncrement(currentUserId, postId);
    }

    /**
     * 浏览量 +1。前端详情页挂载时调用一次。
     */
    @Transactional
    public void incrementView(Long postId) {
        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("view_count = view_count + 1"));
    }

    /**
     * 内部用：读取详情但不递增浏览量。发布/编辑后返回详情时调用。
     */
    private PostDetailResponse getDetailWithoutViewIncrement(Long currentUserId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }

        PostDetailResponse resp = new PostDetailResponse();
        resp.setId(post.getId());
        resp.setTitle(post.getTitle());
        resp.setDescription(post.getDescription());
        resp.setCoverUrl(post.getCoverUrl());
        resp.setUserId(post.getUserId());
        resp.setLikeCount(post.getLikeCount());
        resp.setFavoriteCount(post.getFavoriteCount());
        resp.setCommentCount(post.getCommentCount());
        resp.setViewCount(post.getViewCount());
        resp.setCreatedAt(post.getCreatedAt());
        resp.setUpdatedAt(post.getUpdatedAt());

        User author = userMapper.selectById(post.getUserId());
        if (author != null) {
            resp.setUsername(author.getUsername());
            resp.setUserAvatar(author.getAvatarUrl());
        }

        List<PostFile> files = postFileMapper.selectList(
                new LambdaQueryWrapper<PostFile>()
                        .eq(PostFile::getPostId, postId)
                        .orderByAsc(PostFile::getSortOrder));
        resp.setFiles(files.stream().map(PostConverter::toFileResponse).toList());

        resp.setTags(loadTagsByPostIds(List.of(postId)).getOrDefault(postId, List.of())
                .stream().map(PostConverter::toTagResponse).toList());

        // 当前用户互动状态
        boolean liked = false;
        boolean favorited = false;
        if (currentUserId != null) {
            liked = likeMapper.selectCount(
                    new LambdaQueryWrapper<Like>()
                            .eq(Like::getPostId, postId)
                            .eq(Like::getUserId, currentUserId)) > 0;
            favorited = favoriteMapper.selectCount(
                    new LambdaQueryWrapper<Favorite>()
                            .eq(Favorite::getPostId, postId)
                            .eq(Favorite::getUserId, currentUserId)) > 0;
        }
        resp.setLiked(liked);
        resp.setFavorited(favorited);
        resp.setMine(currentUserId != null && currentUserId.equals(post.getUserId()));

        return resp;
    }

    // ==================== 内部工具 ====================

    private List<FileEntity> loadOwnedFiles(Long userId, List<Long> fileIds) {
        List<FileEntity> files = fileMapper.selectList(
                new LambdaQueryWrapper<FileEntity>()
                        .in(FileEntity::getId, fileIds)
                        .eq(FileEntity::getUserId, userId));
        if (files.size() != fileIds.size()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "存在无效或不属于你的文件");
        }
        Map<Long, FileEntity> map = files.stream()
                .collect(Collectors.toMap(FileEntity::getId, f -> f));
        List<FileEntity> ordered = new ArrayList<>();
        for (Long id : fileIds) {
            FileEntity f = map.get(id);
            if (f == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "文件不存在: " + id);
            }
            ordered.add(f);
        }
        return ordered;
    }

    private String pickCoverUrl(List<FileEntity> files) {
        if (files.isEmpty()) return null;
        FileEntity f = files.get(0);
        return f.getSvgUrl() != null ? f.getSvgUrl() : f.getOriginalUrl();
    }

    private void insertPostFiles(Long postId, List<FileEntity> files) {
        int order = 0;
        for (FileEntity f : files) {
            PostFile pf = new PostFile();
            pf.setPostId(postId);
            pf.setFileId(f.getId());
            pf.setName(f.getName());
            pf.setUrl(f.getSvgUrl() != null ? f.getSvgUrl() : f.getOriginalUrl());
            pf.setFormat(f.getFormat());
            pf.setWidth(f.getWidth());
            pf.setHeight(f.getHeight());
            pf.setSize(f.getSize());
            pf.setSource(f.getSource());
            pf.setSortOrder(order++);
            postFileMapper.insert(pf);
        }
    }

    private void savePostTags(Long postId, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return;
        List<String> cleaned = tagNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(5)
                .toList();

        for (String name : cleaned) {
            Tag tag = tagMapper.selectOne(
                    new LambdaQueryWrapper<Tag>().eq(Tag::getName, name).last("LIMIT 1"));
            if (tag == null) {
                tag = new Tag();
                tag.setName(name);
                tag.setSlug(generateSlug(name));
                tag.setUsageCount(0);
                tagMapper.insert(tag);
            }

            PostTag pt = new PostTag();
            pt.setPostId(postId);
            pt.setTagId(tag.getId());
            postTagMapper.insert(pt);

            tag.setUsageCount(tag.getUsageCount() + 1);
            tagMapper.updateById(tag);
        }
    }

    private String generateSlug(String name) {
        String base = name.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        if (base.isEmpty() || base.equals("-")) {
            base = "tag";
        }
        base = base.replaceAll("^-+|-+$", "");
        if (base.isEmpty()) base = "tag";
        String hash = Integer.toHexString(name.hashCode());
        return base + "-" + hash;
    }

    private List<PostResponse> enrichList(List<Post> posts) {
        if (posts.isEmpty()) return List.of();

        Set<Long> userIds = posts.stream().map(Post::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, List<Tag>> tagMap = loadTagsByPostIds(postIds);

        List<PostResponse> items = new ArrayList<>(posts.size());
        for (Post p : posts) {
            items.add(PostConverter.toResponse(
                    p,
                    userMap.get(p.getUserId()),
                    tagMap.getOrDefault(p.getId(), List.of())
            ));
        }
        return items;
    }

    /**
     * 随机取一个作品 ID。没有作品时返回 null。
     */
    public Long randomPostId() {
        return postMapper.selectRandomId();
    }

    /**
     * 带筛选的分页查询。
     *
     * @param sort    排序字段：latest / like / comment / favorite / view
     * @param order   排序方向：asc / desc
     * @param range   时间范围：today / week / month / year / all
     * @param tagId   标签过滤（可为 null）
     * @param source  来源过滤：convert / upscale（可为 null）
     * @param page    页码，从 1 开始
     * @param size    每页条数
     */
    public PageResponse<PostResponse> searchPaged(String sort, String order, String range,
                                                  Long tagId, String source, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        // 时间范围
        LocalDateTime since = switch (range == null ? "all" : range) {
            case "today" -> LocalDateTime.now().toLocalDate().atStartOfDay();
            case "week"  -> LocalDateTime.now().minusDays(7);
            case "month" -> LocalDateTime.now().minusDays(30);
            case "year"  -> LocalDateTime.now().minusDays(365);
            default      -> null;
        };

        // 排序字段白名单
        String sortKey = (sort == null || sort.isEmpty()) ? "latest" : sort;
        String orderKey = "asc".equalsIgnoreCase(order) ? "asc" : "desc";

        long total = postMapper.countSearchPage(since, tagId, source);
        if (total == 0) {
            return PageResponse.of(List.of(), 0, p, s);
        }

        int offset = (p - 1) * s;
        List<Post> posts = postMapper.selectSearchPage(
                sortKey, orderKey, since, tagId, source, offset, s);

        return PageResponse.of(enrichList(posts), total, p, s);
    }

    /**
     * 用户在社区的统计数字（作品/点赞/收藏/评论总数）。
     */
    public com.svgplatform.modules.community.dto.UserStatsResponse getUserStats(Long userId) {
        com.svgplatform.modules.community.dto.UserStatsResponse stats =
                new com.svgplatform.modules.community.dto.UserStatsResponse();
        stats.setPostCount(postMapper.selectCount(
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, "normal")
                        .eq(Post::getUserId, userId)));
        stats.setLikedCount(likeMapper.selectCount(
                new LambdaQueryWrapper<Like>().eq(Like::getUserId, userId)));
        stats.setFavoritedCount(favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>().eq(Favorite::getUserId, userId)));
        stats.setCommentCount(commentMapper.selectCount(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getUserId, userId)
                        .eq(Comment::getStatus, "normal")));
        return stats;
    }

    // ==================== 个人中心：用户动态 ====================

    /**
     * 用户点赞过的帖子列表（按点赞时间倒序）。
     */
    public PageResponse<PostResponse> listLikedByUser(Long userId, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Like> pager = new Page<>(p, s);
        Page<Like> likePage = likeMapper.selectPage(pager,
                new LambdaQueryWrapper<Like>()
                        .eq(Like::getUserId, userId)
                        .orderByDesc(Like::getCreatedAt));

        List<Long> postIds = likePage.getRecords().stream().map(Like::getPostId).toList();
        if (postIds.isEmpty()) {
            return PageResponse.of(List.of(), likePage.getTotal(), p, s);
        }

        // 只展示仍然 normal 状态的帖子
        Map<Long, Post> postMap = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .in(Post::getId, postIds)
                        .eq(Post::getStatus, "normal")
        ).stream().collect(Collectors.toMap(Post::getId, x -> x));

        List<Post> ordered = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .toList();

        return PageResponse.of(enrichList(ordered), likePage.getTotal(), p, s);
    }

    /**
     * 用户某个收藏夹下的作品列表。
     *
     * @param folderId 收藏夹 ID，为 null 时表示"默认收藏夹"（folder_id IS NULL）
     */
    public PageResponse<PostResponse> listFavoritedByUserInFolder(Long userId, Long folderId, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        LambdaQueryWrapper<Favorite> fw = new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .orderByDesc(Favorite::getCreatedAt);
        if (folderId == null) {
            fw.isNull(Favorite::getFolderId);
        } else {
            fw.eq(Favorite::getFolderId, folderId);
        }

        Page<Favorite> pager = new Page<>(p, s);
        Page<Favorite> favPage = favoriteMapper.selectPage(pager, fw);

        List<Long> postIds = favPage.getRecords().stream().map(Favorite::getPostId).toList();
        if (postIds.isEmpty()) {
            return PageResponse.of(List.of(), favPage.getTotal(), p, s);
        }

        Map<Long, Post> postMap = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .in(Post::getId, postIds)
                        .eq(Post::getStatus, "normal")
        ).stream().collect(Collectors.toMap(Post::getId, x -> x));

        List<Post> ordered = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .toList();

        return PageResponse.of(enrichList(ordered), favPage.getTotal(), p, s);
    }

    /**
     * 用户收藏过的帖子列表（按收藏时间倒序）。
     */
    public PageResponse<PostResponse> listFavoritedByUser(Long userId, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        Page<Favorite> pager = new Page<>(p, s);
        Page<Favorite> favPage = favoriteMapper.selectPage(pager,
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt));

        List<Long> postIds = favPage.getRecords().stream().map(Favorite::getPostId).toList();
        if (postIds.isEmpty()) {
            return PageResponse.of(List.of(), favPage.getTotal(), p, s);
        }

        Map<Long, Post> postMap = postMapper.selectList(
                new LambdaQueryWrapper<Post>()
                        .in(Post::getId, postIds)
                        .eq(Post::getStatus, "normal")
        ).stream().collect(Collectors.toMap(Post::getId, x -> x));

        List<Post> ordered = postIds.stream()
                .map(postMap::get)
                .filter(Objects::nonNull)
                .toList();

        return PageResponse.of(enrichList(ordered), favPage.getTotal(), p, s);
    }

    /**
     * 用户发表的评论列表（按评论时间倒序）。
     */
    public PageResponse<UserCommentResponse> listCommentsByUser(Long userId, int page, int size) {
        int p = Math.max(1, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);

        // 一次性查该用户的所有评论（时间倒序）
        List<Comment> all = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getUserId, userId)
                        .eq(Comment::getStatus, "normal")
                        .orderByDesc(Comment::getCreatedAt));

        if (all.isEmpty()) {
            return PageResponse.of(List.of(), 0, p, s);
        }

        // 按 postId 分组：每组取最新一条 + 记录组内总数
        Map<Long, Comment> latestByPost = new LinkedHashMap<>();
        Map<Long, Integer> countByPost = new HashMap<>();
        for (Comment c : all) {
            Long pid = c.getPostId();
            // all 已按 createdAt 倒序，第一条就是最新
            latestByPost.putIfAbsent(pid, c);
            countByPost.merge(pid, 1, Integer::sum);
        }

        // 分组结果（顺序 = 最新评论的帖子在前）
        List<Comment> merged = new ArrayList<>(latestByPost.values());
        long total = merged.size();

        // 手动分页
        int from = Math.min((p - 1) * s, merged.size());
        int to = Math.min(from + s, merged.size());
        List<Comment> pageList = merged.subList(from, to);

        if (pageList.isEmpty()) {
            return PageResponse.of(List.of(), total, p, s);
        }

        // 批量查帖子
        Set<Long> postIds = pageList.stream().map(Comment::getPostId).collect(Collectors.toSet());
        Map<Long, Post> postMap = postMapper.selectBatchIds(postIds).stream()
                .collect(Collectors.toMap(Post::getId, x -> x));

        List<UserCommentResponse> items = new ArrayList<>(pageList.size());
        for (Comment c : pageList) {
            UserCommentResponse r = new UserCommentResponse();
            r.setId(c.getId());
            r.setPostId(c.getPostId());
            r.setContent(c.getContent());
            r.setCreatedAt(c.getCreatedAt());
            r.setCommentCount(countByPost.getOrDefault(c.getPostId(), 1));
            Post post = postMap.get(c.getPostId());
            if (post != null) {
                r.setPostTitle(post.getTitle());
                r.setPostCover(post.getCoverUrl());
            }
            items.add(r);
        }
        return PageResponse.of(items, total, p, s);
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