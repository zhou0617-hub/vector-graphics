package com.svgplatform.modules.user.converter;

import com.svgplatform.modules.user.dto.UserResponse;
import com.svgplatform.modules.user.entity.User;

public final class UserConverter {

    private UserConverter() {}

    public static UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setEmail(user.getEmail());
        resp.setUsername(user.getUsername());
        resp.setAvatarUrl(user.getAvatarUrl());
        resp.setBio(user.getBio());
        resp.setRole(user.getRole());
        resp.setCreatedAt(user.getCreatedAt());
        return resp;
    }
}
