package com.svgplatform.modules.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 512, message = "头像地址过长")
    private String avatarUrl;

    @Size(max = 512, message = "简介过长")
    private String bio;
}
