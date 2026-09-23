package com.svgplatform.modules.conversion.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.infrastructure.storage.StorageService;
import com.svgplatform.infrastructure.vectorizer.VectorizerClient;
import com.svgplatform.modules.conversion.dto.ConvertResponse;
import com.svgplatform.modules.conversion.entity.Conversion;
import com.svgplatform.modules.conversion.repository.ConversionMapper;
import com.svgplatform.modules.file.entity.FileEntity;
import com.svgplatform.modules.file.repository.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversionService {

    private static final Set<String> ALLOWED_FORMATS = Set.of("PNG", "JPEG", "JPG", "WEBP");
    private static final long MAX_SIZE = 10 * 1024 * 1024L;
    private static final Pattern SVG_WIDTH = Pattern.compile("width=\"(\\d+)\"");

    private final FileMapper fileMapper;
    private final ConversionMapper conversionMapper;
    private final StorageService storageService;
    private final VectorizerClient vectorizerClient;

    @Transactional
    public ConvertResponse convert(Long userId, MultipartFile file, String params) {
        validate(file);

        String originalName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        String ext = extractExt(originalName);
        String format = ext.toUpperCase();
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String baseName = UUID.randomUUID().toString().replace("-", "");

        // 1. 保存原图
        byte[] imageBytes;
        try {
            imageBytes = file.getBytes();
        } catch (Exception e) {
            throw new BusinessException("读取文件失败");
        }

        String originalRelative = datePath + "/" + baseName + "." + ext.toLowerCase();
        storageService.store(imageBytes, originalRelative);

        // 2. 创建 files 记录
        FileEntity fileEntity = new FileEntity();
        fileEntity.setUserId(userId);
        fileEntity.setName(originalName);
        fileEntity.setOriginalUrl(storageService.getPublicUrl(originalRelative));
        fileEntity.setFormat(format);
        fileEntity.setSize((long) imageBytes.length);
        fileEntity.setStatus("normal");
        fileMapper.insert(fileEntity);

        // 3. 创建 conversions 记录
        Conversion conv = new Conversion();
        conv.setUserId(userId);
        conv.setFileId(fileEntity.getId());
        conv.setSourceFormat(format);
        conv.setTargetFormat("SVG");
        conv.setStatus("processing");
        conv.setParamsJson(params);
        conversionMapper.insert(conv);

        // 4. 调用矢量化服务
        String svg;
        try {
            svg = vectorizerClient.vectorize(imageBytes, originalName, params);
        } catch (BusinessException e) {
            conv.setStatus("failed");
            conv.setErrorMessage(e.getMessage());
            conv.setFinishedAt(LocalDateTime.now());
            conversionMapper.updateById(conv);

            ConvertResponse resp = new ConvertResponse();
            resp.setConversionId(conv.getId());
            resp.setFileId(fileEntity.getId());
            resp.setStatus("failed");
            resp.setMessage(e.getMessage());
            return resp;
        }

        // 5. 保存 SVG
        String svgRelative = datePath + "/" + baseName + ".svg";
        storageService.store(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8), svgRelative);
        String svgUrl = storageService.getPublicUrl(svgRelative);

        // 6. 更新记录
        fileEntity.setSvgUrl(svgUrl);
        Integer width = parseDimension(svg, "width");
        Integer height = parseDimension(svg, "height");
        fileEntity.setWidth(width);
        fileEntity.setHeight(height);
        fileMapper.updateById(fileEntity);

        conv.setStatus("success");
        conv.setResultUrl(svgUrl);
        conv.setFinishedAt(LocalDateTime.now());
        conversionMapper.updateById(conv);

        // 7. 返回
        ConvertResponse resp = new ConvertResponse();
        resp.setConversionId(conv.getId());
        resp.setFileId(fileEntity.getId());
        resp.setStatus("success");
        resp.setSvgUrl(svgUrl);
        resp.setOriginalUrl(fileEntity.getOriginalUrl());
        resp.setWidth(width);
        resp.setHeight(height);
        resp.setMessage("转换成功");
        return resp;
    }

    public Conversion getById(Long userId, Long id) {
        Conversion conv = conversionMapper.selectOne(
                new LambdaQueryWrapper<Conversion>()
                        .eq(Conversion::getId, id)
                        .eq(Conversion::getUserId, userId)
        );
        if (conv == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "转换记录不存在");
        }
        return conv;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BusinessException("文件超过 10MB");
        }
        String name = file.getOriginalFilename();
        String ext = extractExt(name);
        if (!ALLOWED_FORMATS.contains(ext.toUpperCase())) {
            throw new BusinessException("仅支持 PNG / JPG / WebP");
        }
    }

    private String extractExt(String name) {
        if (name == null) return "png";
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "png";
        return name.substring(dot + 1);
    }

    private Integer parseDimension(String svg, String attr) {
        Matcher m = Pattern.compile(attr + "=\"(\\d+)\"").matcher(svg);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
