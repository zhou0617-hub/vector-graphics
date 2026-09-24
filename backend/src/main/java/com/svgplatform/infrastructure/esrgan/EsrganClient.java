package com.svgplatform.infrastructure.esrgan;

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
