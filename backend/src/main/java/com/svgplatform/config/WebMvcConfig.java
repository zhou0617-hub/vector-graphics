package com.svgplatform.config;

import com.svgplatform.infrastructure.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String baseDir = Paths.get(storageProperties.getLocal().getBaseDir())
                .toAbsolutePath().normalize()
                .toUri().toString();

        String prefix = storageProperties.getLocal().getPublicPrefix();
        if (!prefix.endsWith("/")) prefix = prefix + "/";

        registry.addResourceHandler(prefix + "**")
                .addResourceLocations(baseDir);
    }
}
