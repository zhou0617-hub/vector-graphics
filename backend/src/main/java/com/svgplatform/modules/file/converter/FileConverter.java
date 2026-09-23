package com.svgplatform.modules.file.converter;

import com.svgplatform.modules.file.dto.FileResponse;
import com.svgplatform.modules.file.entity.FileEntity;

public final class FileConverter {

    private FileConverter() {}

    public static FileResponse toResponse(FileEntity file) {
        if (file == null) return null;
        FileResponse resp = new FileResponse();
        resp.setId(file.getId());
        resp.setName(file.getName());
        resp.setOriginalUrl(file.getOriginalUrl());
        resp.setSvgUrl(file.getSvgUrl());
        resp.setFormat(file.getFormat());
        resp.setSize(file.getSize());
        resp.setWidth(file.getWidth());
        resp.setHeight(file.getHeight());
        resp.setCreatedAt(file.getCreatedAt());
        return resp;
    }
}
