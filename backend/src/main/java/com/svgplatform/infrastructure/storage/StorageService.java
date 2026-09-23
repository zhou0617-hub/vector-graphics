package com.svgplatform.infrastructure.storage;

import java.nio.file.Path;

public interface StorageService {

    /** 保存文件，返回相对路径，如 2026/09/xxx.png */
    String store(byte[] content, String relativePath);

    /** 读取文件内容 */
    byte[] read(String relativePath);

    /** 删除文件 */
    void delete(String relativePath);

    /** 获取可访问的 URL */
    String getPublicUrl(String relativePath);

    /** 解析为本地绝对路径（本地存储专用） */
    Path resolve(String relativePath);
}
