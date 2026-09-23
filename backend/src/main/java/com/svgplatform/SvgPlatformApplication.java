package com.svgplatform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.svgplatform.modules.**.repository")
public class SvgPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(SvgPlatformApplication.class, args);
    }
}
