package com.svgplatform.modules.conversion.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.conversion.dto.ConversionResponse;
import com.svgplatform.modules.conversion.dto.ConvertResponse;
import com.svgplatform.modules.conversion.dto.UpscaleResponse;
import com.svgplatform.modules.conversion.service.ConversionService;
import com.svgplatform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/conversions")
@RequiredArgsConstructor
public class ConversionController {

    private final ConversionService conversionService;

    @PostMapping("/convert")
    public ApiResponse<ConvertResponse> convert(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "params", required = false) String params
    ) {
        return ApiResponse.success(
                conversionService.convert(SecurityUtils.currentUserId(), file, params));
    }

    @PostMapping("/upscale")
    public ApiResponse<UpscaleResponse> upscale(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "model", required = false, defaultValue = "anime") String model) {
        return ApiResponse.success(conversionService.upscale(SecurityUtils.currentUserId(), file, model));
    }

    @GetMapping("/{id}")
    public ApiResponse<ConversionResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(conversionService.getById(SecurityUtils.currentUserId(), id));
    }
}