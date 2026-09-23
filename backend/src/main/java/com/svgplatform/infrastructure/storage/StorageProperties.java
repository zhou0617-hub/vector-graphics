package com.svgplatform.infrastructure.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String type = "local";
    private Local local = new Local();

    @Data
    public static class Local {
        private String baseDir = "./data/uploads";
        private String publicPrefix = "/static/uploads";
    }
}
