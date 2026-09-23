package com.svgplatform.modules.user.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class UserResponse implements Serializable {

    private Long id;
    private String email;
    private String username;
    private String avatarUrl;
    private String bio;
    private String role;
    private LocalDateTime createdAt;
}
