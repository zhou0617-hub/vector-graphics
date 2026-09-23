package com.svgplatform.modules.file.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.file.converter.FileConverter;
import com.svgplatform.modules.file.dto.BatchDeleteRequest;
import com.svgplatform.modules.file.dto.FileResponse;
import com.svgplatform.modules.file.service.FileService;
import com.svgplatform.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping("/my")
    public ApiResponse<List<FileResponse>> myFiles() {
        Long userId = SecurityUtils.currentUserId();
        return ApiResponse.success(
                fileService.listMine(userId).stream().map(FileConverter::toResponse).toList()
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        fileService.delete(SecurityUtils.currentUserId(), id);
        return ApiResponse.success();
    }

    @PostMapping("/batch-delete")
    public ApiResponse<Void> batchDelete(@Valid @RequestBody BatchDeleteRequest req) {
        fileService.batchDelete(SecurityUtils.currentUserId(), req.getIds());
        return ApiResponse.success();
    }
}
