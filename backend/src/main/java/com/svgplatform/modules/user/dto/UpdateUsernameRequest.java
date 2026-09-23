package com.svgplatform.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUsernameRequest {

    @NotBlank(message = "用户名不能为空")
    @Pattern(regexp = "^[a-zA-Z0-9_-]{3,32}$",
            message = "用户名只能包含字母、数字、下划线、中划线，长度 3-32")
    private String username;
}
