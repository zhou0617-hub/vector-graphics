package com.svgplatform.modules.file.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.infrastructure.storage.StorageService;
import com.svgplatform.modules.file.entity.FileEntity;
import com.svgplatform.modules.file.repository.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private static final String PUBLIC_PREFIX = "/static/uploads/";

    private final FileMapper fileMapper;
    private final StorageService storageService;

    public List<FileEntity> listMine(Long userId) {
        return fileMapper.selectList(
                new LambdaQueryWrapper<FileEntity>()
                        .eq(FileEntity::getUserId, userId)
                        .orderByDesc(FileEntity::getCreatedAt)
                        .last("LIMIT 200")
        );
    }

    @Transactional
    public void delete(Long userId, Long fileId) {
        FileEntity file = fileMapper.selectById(fileId);
        if (file == null || !file.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "文件不存在");
        }
        removePhysicalFiles(file);
        fileMapper.deleteById(fileId);
    }

    @Transactional
    public void batchDelete(Long userId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        List<FileEntity> list = fileMapper.selectList(
                new LambdaQueryWrapper<FileEntity>()
                        .eq(FileEntity::getUserId, userId)
                        .in(FileEntity::getId, ids)
        );
        for (FileEntity f : list) {
            removePhysicalFiles(f);
        }
        if (!list.isEmpty()) {
            fileMapper.deleteBatchIds(list.stream().map(FileEntity::getId).toList());
        }
    }

    private void removePhysicalFiles(FileEntity file) {
        deleteByUrl(file.getOriginalUrl());
        deleteByUrl(file.getSvgUrl());
    }

    private void deleteByUrl(String url) {
        if (url == null || !url.startsWith(PUBLIC_PREFIX)) {
            return;
        }
        String relative = url.substring(PUBLIC_PREFIX.length());
        try {
            storageService.delete(relative);
        } catch (Exception e) {
            log.warn("删除本地文件失败: {}", relative, e);
        }
    }
}
