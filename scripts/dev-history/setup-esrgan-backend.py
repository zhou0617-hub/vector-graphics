import os
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"
JAVA = BACKEND / "src" / "main" / "java" / "com" / "svgplatform"
RES = BACKEND / "src" / "main" / "resources"


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [创建] {path.relative_to(ROOT)}")


def patch(path, old, new, desc=""):
    if not path.exists():
        print(f"  [跳过] {path.relative_to(ROOT)} 不存在")
        return False
    content = path.read_text(encoding="utf-8")
    if new in content:
        print(f"  [已存在] {path.relative_to(ROOT)}")
        return False
    if old not in content:
        print(f"  [警告] {path.relative_to(ROOT)} 未找到锚点: {desc}")
        return False
    content = content.replace(old, new, 1)
    path.write_text(content, encoding="utf-8")
    print(f"  [修改] {path.relative_to(ROOT)} - {desc}")
    return True


print("=" * 60)
print("Real-ESRGAN 后端集成")
print("=" * 60)
print()

print("[1/8] Flyway 迁移脚本")
write(RES / "db" / "migration" / "V2__add_source_to_files.sql", "ALTER TABLE files \nADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'convert' \nCOMMENT '来源: convert / upscale' \nAFTER format;\n")

print("\n[2/8] EsrganProperties")
write(JAVA / "infrastructure" / "esrgan" / "EsrganProperties.java", """package com.svgplatform.infrastructure.esrgan;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.esrgan")
public class EsrganProperties {
    private String baseUrl = "http://localhost:8001";
    private int timeoutMs = 300000;
}
""")

print("\n[3/8] EsrganClient")
write(JAVA / "infrastructure" / "esrgan" / "EsrganClient.java", """package com.svgplatform.infrastructure.esrgan;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svgplatform.common.exception.BusinessException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Base64;

@Component
public class EsrganClient {

    private static final int MAX_IN_MEMORY_SIZE = 500 * 1024 * 1024;
    private static final int MAX_STRING_LENGTH = 500 * 1024 * 1024;

    private final EsrganProperties props;
    private final ObjectMapper objectMapper;

    public EsrganClient(EsrganProperties props) {
        this.props = props;
        this.objectMapper = new ObjectMapper(
            JsonFactory.builder()
                .streamReadConstraints(
                    StreamReadConstraints.builder()
                        .maxStringLength(MAX_STRING_LENGTH)
                        .build()
                )
                .build()
        );
    }

    private WebClient buildClient() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
            .build();
        return WebClient.builder().baseUrl(props.getBaseUrl()).exchangeStrategies(strategies).build();
    }

    public byte[] upscale(byte[] imageBytes, String filename, String model) {
        WebClient client = buildClient();
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(imageBytes) {
            @Override public String getFilename() { return filename; }
        });
        builder.part("model", model == null ? "anime" : model);

        try {
            String response = client.post()
                .uri("/api/upscale")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve().bodyToMono(String.class)
                .timeout(Duration.ofMillis(props.getTimeoutMs())).block();

            JsonNode root = objectMapper.readTree(response);
            if (!root.path("success").asBoolean(false)) {
                throw new BusinessException("超分失败: " + root.path("message").asText("未知"));
            }
            return Base64.getDecoder().decode(root.path("image_base64").asText());
        } catch (BusinessException e) {
            throw e;
        } catch (WebClientResponseException e) {
            throw new BusinessException("超分失败: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new BusinessException("超分失败: " + e.getMessage());
        }
    }
}
""")

print("\n[4/8] UpscaleResponse")
write(JAVA / "modules" / "conversion" / "dto" / "UpscaleResponse.java", """package com.svgplatform.modules.conversion.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class UpscaleResponse implements Serializable {
    private Long fileId;
    private String status;
    private String originalUrl;
    private String resultUrl;
    private Integer width;
    private Integer height;
    private String message;
}
""")

print("\n[5/8] FileEntity 加 source 字段")
patch(
    JAVA / "modules" / "file" / "entity" / "FileEntity.java",
    "    private String format;\n    private Long size;",
    "    private String format;\n    private String source;\n    private Long size;",
    "添加 source 字段"
)

print("\n[6/8] ConversionService 加超分方法")
conv = JAVA / "modules" / "conversion" / "service" / "ConversionService.java"

patch(conv,
    "import com.svgplatform.infrastructure.vectorizer.VectorizerClient;",
    "import com.svgplatform.infrastructure.vectorizer.VectorizerClient;\nimport com.svgplatform.infrastructure.esrgan.EsrganClient;\nimport com.svgplatform.modules.conversion.dto.UpscaleResponse;\nimport java.io.ByteArrayInputStream;\nimport javax.imageio.ImageIO;\nimport java.awt.image.BufferedImage;",
    "添加 import")

patch(conv,
    "    private final VectorizerClient vectorizerClient;",
    "    private final VectorizerClient vectorizerClient;\n    private final EsrganClient esrganClient;",
    "注入 EsrganClient")

content = conv.read_text(encoding="utf-8")
if "public UpscaleResponse upscale" not in content:
    method = """
    @Transactional
    public UpscaleResponse upscale(Long userId, MultipartFile file, String model) {
        validate(file);
        String originalName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        String ext = extractExt(originalName);
        String format = ext.toUpperCase();
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String baseName = UUID.randomUUID().toString().replace("-", "");

        byte[] imageBytes;
        try { imageBytes = file.getBytes(); } catch (Exception e) { throw new BusinessException("读取文件失败"); }

        String originalRelative = datePath + "/" + baseName + "." + ext.toLowerCase();
        storageService.store(imageBytes, originalRelative);

        FileEntity fileEntity = new FileEntity();
        fileEntity.setUserId(userId);
        fileEntity.setName(originalName);
        fileEntity.setOriginalUrl(storageService.getPublicUrl(originalRelative));
        fileEntity.setFormat(format);
        fileEntity.setSource("upscale");
        fileEntity.setSize((long) imageBytes.length);
        fileEntity.setStatus("normal");
        fileMapper.insert(fileEntity);

        byte[] upscaledBytes;
        try {
            upscaledBytes = esrganClient.upscale(imageBytes, originalName, model);
        } catch (BusinessException e) {
            UpscaleResponse resp = new UpscaleResponse();
            resp.setFileId(fileEntity.getId());
            resp.setStatus("failed");
            resp.setOriginalUrl(fileEntity.getOriginalUrl());
            resp.setMessage(e.getMessage());
            return resp;
        }

        String upscaledRelative = datePath + "/" + baseName + "_upscaled.png";
        storageService.store(upscaledBytes, upscaledRelative);
        String upscaledUrl = storageService.getPublicUrl(upscaledRelative);

        Integer width = null, height = null;
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(upscaledBytes));
            if (img != null) { width = img.getWidth(); height = img.getHeight(); }
        } catch (Exception ignored) {}

        fileEntity.setSvgUrl(upscaledUrl);
        fileEntity.setWidth(width);
        fileEntity.setHeight(height);
        fileMapper.updateById(fileEntity);

        UpscaleResponse resp = new UpscaleResponse();
        resp.setFileId(fileEntity.getId());
        resp.setStatus("success");
        resp.setOriginalUrl(fileEntity.getOriginalUrl());
        resp.setResultUrl(upscaledUrl);
        resp.setWidth(width);
        resp.setHeight(height);
        resp.setMessage("超分成功");
        return resp;
    }
}
"""
    idx = content.rfind("}")
    content = content[:idx] + method
    conv.write_text(content, encoding="utf-8")
    print(f"  [修改] ConversionService.java - 添加 upscale 方法")
else:
    print(f"  [已存在] ConversionService.java")

print("\n[7/8] ConversionController 加接口")
ctrl = JAVA / "modules" / "conversion" / "controller" / "ConversionController.java"

patch(ctrl,
    "import com.svgplatform.modules.conversion.dto.ConvertResponse;",
    "import com.svgplatform.modules.conversion.dto.ConvertResponse;\nimport com.svgplatform.modules.conversion.dto.UpscaleResponse;",
    "添加 import")

patch(ctrl,
    '    @GetMapping("/{id}")',
    """    @PostMapping("/upscale")
    public ApiResponse<UpscaleResponse> upscale(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "model", required = false, defaultValue = "anime") String model) {
        return ApiResponse.success(conversionService.upscale(SecurityUtils.currentUserId(), file, model));
    }

    @GetMapping("/{id}")""",
    "添加 /upscale 接口")

print("\n[8/8] application-dev.yml 加 esrgan 配置")
patch(RES / "application-dev.yml",
    "  vectorizer:\n    base-url: http://localhost:8000",
    "  vectorizer:\n    base-url: http://localhost:8000\n  esrgan:\n    base-url: http://localhost:8001\n    timeout-ms: 300000",
    "添加 esrgan 配置")

print()
print("=" * 60)
print("完成！")
print("=" * 60)
