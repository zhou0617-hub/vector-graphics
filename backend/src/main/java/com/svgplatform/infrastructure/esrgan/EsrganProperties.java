package com.svgplatform.infrastructure.esrgan;

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
