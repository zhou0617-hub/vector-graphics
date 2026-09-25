package com.svgplatform.modules.community.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.modules.community.dto.CommentCreateRequest;
import com.svgplatform.modules.community.dto.CommentResponse;
import com.svgplatform.modules.community.entity.Comment;
import com.svgplatform.modules.community.entity.Post;
import com.svgplatform.modules.community.repository.CommentMapper;
import com.svgplatform.modules.community.repository.PostMapper;
import com.svgplatform.modules.user.entity.User;
import com.svgplatform.modules.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 评论业务逻辑。
 * <p>
 * 支持二级结构：顶级评论 + 回复。
 * 列表接口一次性返回所有顶级评论及其子回复，避免前端多次请求。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;

    /**
     * 发表评论。
     *
     * @param currentUserId 评论者 ID
     * @param postId        作品 ID
     * @param req           评论请求
     * @return 新建的评论（含作者信息）
     */
    @Transactional
    public CommentResponse create(Long currentUserId, Long postId, CommentCreateRequest req) {
        Post post = postMapper.selectById(postId);
        if (post == null || !"normal".equals(post.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "作品不存在");
        }

        // 回复场景：校验父评论是否存在且属于同一作品
        if (req.getParentId() != null) {
            Comment parent = commentMapper.selectById(req.getParentId());
            if (parent == null || !"normal".equals(parent.getStatus())
                    || !parent.getPostId().equals(postId)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "父评论不存在");
            }
            // 限制二级：如果父评论本身是回复，则挂到它的父评论下
            if (parent.getParentId() != null) {
                req.setParentId(parent.getParentId());
            }
        }

        Comment c = new Comment();
        c.setPostId(postId);
        c.setUserId(currentUserId);
        c.setParentId(req.getParentId());
        c.setContent(req.getContent().trim());
        c.setStatus("normal");
        commentMapper.insert(c);

        // 同步 posts.comment_count
        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, postId)
                        .setSql("comment_count = comment_count + 1"));

        return toResponse(c, userMapper.selectById(currentUserId), currentUserId, List.of());
    }

    /**
     * 删除评论。仅作者本人可删。
     */
    @Transactional
    public void delete(Long currentUserId, Long commentId) {
        Comment c = commentMapper.selectById(commentId);
        if (c == null || !"normal".equals(c.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "评论不存在");
        }
        if (!c.getUserId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "只能删除自己的评论");
        }
        c.setStatus("deleted");
        commentMapper.updateById(c);

        postMapper.update(null,
                new LambdaUpdateWrapper<Post>()
                        .eq(Post::getId, c.getPostId())
                        .setSql("comment_count = GREATEST(comment_count - 1, 0)"));
    }

    /**
     * 某作品下的评论列表（两级结构）。
     */
    public List<CommentResponse> listByPost(Long currentUserIdOrNull, Long postId) {
        // 一次性取所有 normal 评论
        List<Comment> all = commentMapper.selectList(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getPostId, postId)
                        .eq(Comment::getStatus, "normal")
                        .orderByAsc(Comment::getCreatedAt));

        if (all.isEmpty()) return List.of();

        // 批量查用户
        Set<Long> userIds = all.stream().map(Comment::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 分组：顶级评论 + 子回复
        List<Comment> tops = new ArrayList<>();
        Map<Long, List<Comment>> childrenByParent = new HashMap<>();
        for (Comment c : all) {
            if (c.getParentId() == null) {
                tops.add(c);
            } else {
                childrenByParent.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c);
            }
        }

        // 组装响应
        List<CommentResponse> result = new ArrayList<>();
        for (Comment top : tops) {
            List<Comment> children = childrenByParent.getOrDefault(top.getId(), List.of());
            List<CommentResponse> childResps = children.stream()
                    .map(c -> toResponse(c, userMap.get(c.getUserId()), currentUserIdOrNull, List.of()))
                    .toList();
            result.add(toResponse(top, userMap.get(top.getUserId()), currentUserIdOrNull, childResps));
        }
        return result;
    }

    // ==================== 内部工具 ====================

    private CommentResponse toResponse(Comment c, User author, Long currentUserIdOrNull, List<CommentResponse> replies) {
        CommentResponse resp = new CommentResponse();
        resp.setId(c.getId());
        resp.setPostId(c.getPostId());
        resp.setParentId(c.getParentId());
        resp.setContent(c.getContent());
        resp.setCreatedAt(c.getCreatedAt());
        resp.setUserId(c.getUserId());
        if (author != null) {
            resp.setUsername(author.getUsername());
            resp.setUserAvatar(author.getAvatarUrl());
        }
        resp.setMine(currentUserIdOrNull != null && currentUserIdOrNull.equals(c.getUserId()));
        resp.setReplies(replies == null ? List.of() : replies);
        return resp;
    }
}