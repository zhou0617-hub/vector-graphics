package com.svgplatform.modules.community.converter;

import com.svgplatform.modules.community.dto.PostFileResponse;
import com.svgplatform.modules.community.dto.PostResponse;
import com.svgplatform.modules.community.dto.TagResponse;
import com.svgplatform.modules.community.entity.Post;
import com.svgplatform.modules.community.entity.PostFile;
import com.svgplatform.modules.community.entity.Tag;
import com.svgplatform.modules.user.entity.User;

import java.util.List;

/**
 * 社区模块的实体到 DTO 转换工具。
 * <p>
 * 所有方法均为静态，无状态。DTO 里的作者信息、标签列表由调用方预取后传入，
 * 避免在转换器里再查数据库。
 */
public final class PostConverter {

    private PostConverter() {}

    /**
     * 转换为列表项响应体。
     *
     * @param post   作品实体
     * @param author 作者用户实体（可能为 null，此时作者字段留空）
     * @param tags   标签列表（可能为空）
     */
    public static PostResponse toResponse(Post post, User author, List<Tag> tags) {
        if (post == null) return null;
        PostResponse resp = new PostResponse();
        resp.setId(post.getId());
        resp.setTitle(post.getTitle());
        resp.setDescription(post.getDescription());
        resp.setCoverUrl(post.getCoverUrl());
        resp.setUserId(post.getUserId());
        if (author != null) {
            resp.setUsername(author.getUsername());
            resp.setUserAvatar(author.getAvatarUrl());
        }
        resp.setLikeCount(post.getLikeCount());
        resp.setFavoriteCount(post.getFavoriteCount());
        resp.setCommentCount(post.getCommentCount());
        resp.setViewCount(post.getViewCount());
        resp.setCreatedAt(post.getCreatedAt());
        resp.setTags(tags == null ? List.of() : tags.stream().map(PostConverter::toTagResponse).toList());
        return resp;
    }

    public static TagResponse toTagResponse(Tag tag) {
        if (tag == null) return null;
        TagResponse resp = new TagResponse();
        resp.setId(tag.getId());
        resp.setName(tag.getName());
        resp.setSlug(tag.getSlug());
        resp.setUsageCount(tag.getUsageCount());
        return resp;
    }

    public static PostFileResponse toFileResponse(PostFile f) {
        if (f == null) return null;
        PostFileResponse resp = new PostFileResponse();
        resp.setId(f.getId());
        resp.setName(f.getName());
        resp.setUrl(f.getUrl());
        resp.setFormat(f.getFormat());
        resp.setWidth(f.getWidth());
        resp.setHeight(f.getHeight());
        resp.setSize(f.getSize());
        resp.setSource(f.getSource());
        return resp;
    }
}