package com.svgplatform.modules.user.controller;

import com.svgplatform.common.response.ApiResponse;
import com.svgplatform.modules.user.dto.UpdatePasswordRequest;
import com.svgplatform.modules.user.dto.UpdateProfileRequest;
import com.svgplatform.modules.user.dto.UpdateUsernameRequest;
import com.svgplatform.modules.user.dto.UserResponse;
import com.svgplatform.modules.user.service.UserService;
import com.svgplatform.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.success(userService.getProfile(SecurityUtils.currentUserId()));
    }

    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.success(
                userService.updateProfile(SecurityUtils.currentUserId(), req));
    }

    @PatchMapping("/me/username")
    public ApiResponse<UserResponse> updateUsername(
            @Valid @RequestBody UpdateUsernameRequest req) {
        return ApiResponse.success(
                userService.updateUsername(SecurityUtils.currentUserId(), req.getUsername()));
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest req) {
        userService.updatePassword(
                SecurityUtils.currentUserId(),
                req.getOldPassword(),
                req.getNewPassword());
        return ApiResponse.success();
    }

    @PostMapping("/me/avatar")
    public ApiResponse<UserResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(
                userService.uploadAvatar(SecurityUtils.currentUserId(), file));
    }

    @GetMapping("/{username}")
    public ApiResponse<UserResponse> getByUsername(@PathVariable String username) {
        return ApiResponse.success(userService.getByUsername(username));
    }
}
