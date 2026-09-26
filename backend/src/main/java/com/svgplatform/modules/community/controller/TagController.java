package com.svgplatform.modules.community.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.community.converter.PostConverter;
import com.svgplatform.modules.community.dto.TagResponse;
import com.svgplatform.modules.community.entity.Tag;
import com.svgplatform.modules.community.repository.TagMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 标签接口。全部公开，未登录可访问。
 */
@RestController
@RequestMapping("/api/community/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagMapper tagMapper;

    /**
     * 列出全部标签，按引用次数降序。
     */
    @GetMapping
    public ApiResponse<List<TagResponse>> listAll() {
        List<Tag> tags = tagMapper.selectList(
                new LambdaQueryWrapper<Tag>().orderByDesc(Tag::getUsageCount));
        return ApiResponse.success(tags.stream().map(PostConverter::toTagResponse).toList());
    }
}