package com.svgplatform.infrastructure.vectorizer;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.vectorizer")
public class VectorizerProperties {

    private String baseUrl = "http://localhost:8000";
    private int timeoutMs = 300000;
}
