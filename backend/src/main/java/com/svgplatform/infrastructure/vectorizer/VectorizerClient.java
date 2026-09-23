package com.svgplatform.infrastructure.vectorizer;

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

@Component
public class VectorizerClient {

    /** WebClient 最大内存缓冲：200MB，容纳大 SVG */
    private static final int MAX_IN_MEMORY_SIZE = 200 * 1024 * 1024;

    /** Jackson 单个字符串最大长度：200MB，容纳大 SVG 字段 */
    private static final int MAX_STRING_LENGTH = 200 * 1024 * 1024;

    private final VectorizerProperties props;
    private final ObjectMapper objectMapper;

    public VectorizerClient(VectorizerProperties props) {
        this.props = props;

        // 关键：调大 Jackson 的字符串长度限制，否则解析大 SVG 时抛 StreamConstraintsException
        this.objectMapper = new ObjectMapper(
                com.fasterxml.jackson.core.JsonFactory.builder()
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

        return WebClient.builder()
                .baseUrl(props.getBaseUrl())
                .exchangeStrategies(strategies)
                .build();
    }

    public String vectorize(byte[] imageBytes, String filename, String paramsJson) {
        WebClient client = buildClient();

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        builder.part("params", paramsJson == null ? "{}" : paramsJson);

        try {
            String response = client.post()
                    .uri("/api/vectorize")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(props.getTimeoutMs()))
                    .block();

            JsonNode root = objectMapper.readTree(response);
            if (!root.path("success").asBoolean(false)) {
                throw new BusinessException("矢量化失败: " + root.path("message").asText("未知错误"));
            }
            return root.path("svg").asText();
        } catch (BusinessException e) {
            throw e;
        } catch (WebClientResponseException e) {
            String body = e.getResponseBodyAsString();
            throw new BusinessException("矢量化失败(status=" + e.getStatusCode() + "): " + body);
        } catch (Exception e) {
            String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            throw new BusinessException("矢量化失败: " + msg);
        }
    }
}
