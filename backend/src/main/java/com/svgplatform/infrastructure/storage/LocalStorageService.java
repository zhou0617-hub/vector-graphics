package com.svgplatform.infrastructure.storage;

import com.svgplatform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final StorageProperties props;

    @Override
    public String store(byte[] content, String relativePath) {
        try {
            Path full = resolve(relativePath);
            Files.createDirectories(full.getParent());
            Files.write(full, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return relativePath;
        } catch (IOException e) {
            log.error("存储文件失败: {}", relativePath, e);
            throw new BusinessException("文件存储失败");
        }
    }

    @Override
    public byte[] read(String relativePath) {
        try {
            return Files.readAllBytes(resolve(relativePath));
        } catch (IOException e) {
            throw new BusinessException("文件读取失败");
        }
    }

    @Override
    public void delete(String relativePath) {
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException e) {
            log.warn("删除文件失败: {}", relativePath, e);
        }
    }

    @Override
    public String getPublicUrl(String relativePath) {
        if (relativePath == null) return null;
        String prefix = props.getLocal().getPublicPrefix();
        if (!prefix.endsWith("/")) prefix = prefix + "/";
        return prefix + relativePath;
    }

    @Override
    public Path resolve(String relativePath) {
        Path base = Paths.get(props.getLocal().getBaseDir()).toAbsolutePath().normalize();
        Path full = base.resolve(relativePath).normalize();
        if (!full.startsWith(base)) {
            throw new BusinessException("非法路径");
        }
        return full;
    }
}
