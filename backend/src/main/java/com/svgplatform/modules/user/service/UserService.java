package com.svgplatform.modules.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.infrastructure.storage.StorageService;
import com.svgplatform.modules.user.converter.UserConverter;
import com.svgplatform.modules.user.dto.UpdateProfileRequest;
import com.svgplatform.modules.user.dto.UserResponse;
import com.svgplatform.modules.user.entity.User;
import com.svgplatform.modules.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024L;
    private static final Set<String> AVATAR_TYPES = Set.of("PNG", "JPEG", "JPG", "WEBP");
    private static final String PUBLIC_PREFIX = "/static/uploads/";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    public User getById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        return user;
    }

    public UserResponse getProfile(Long id) {
        return UserConverter.toResponse(getById(id));
    }

    public UserResponse getByUsername(String username) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        return UserConverter.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = getById(userId);
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().isBlank() ? null : req.getAvatarUrl());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio());
        }
        userMapper.updateById(user);
        return UserConverter.toResponse(user);
    }

    @Transactional
    public UserResponse updateUsername(Long userId, String newUsername) {
        User user = getById(userId);
        if (newUsername.equals(user.getUsername())) {
            return UserConverter.toResponse(user);
        }
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, newUsername)
        );
        if (count != null && count > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "用户名已被占用");
        }
        user.setUsername(newUsername);
        userMapper.updateById(user);
        return UserConverter.toResponse(user);
    }

    @Transactional
    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = getById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "原密码错误");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    @Transactional
    public UserResponse uploadAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择头像文件");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BusinessException("头像大小不能超过 2MB");
        }
        String originalName = file.getOriginalFilename() == null ? "avatar.png" : file.getOriginalFilename();
        String ext = extractExt(originalName).toUpperCase();
        if (!AVATAR_TYPES.contains(ext)) {
            throw new BusinessException("头像仅支持 PNG / JPG / WebP");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BusinessException("读取头像失败");
        }

        String relative = "avatars/" + userId + "/"
                + UUID.randomUUID().toString().replace("-", "")
                + "." + ext.toLowerCase();

        storageService.store(bytes, relative);
        String newUrl = storageService.getPublicUrl(relative);

        User user = getById(userId);
        String oldUrl = user.getAvatarUrl();
        user.setAvatarUrl(newUrl);
        userMapper.updateById(user);

        // 删除旧头像（如果是本地上传的）
        if (StringUtils.hasText(oldUrl) && oldUrl.startsWith(PUBLIC_PREFIX)) {
            try {
                storageService.delete(oldUrl.substring(PUBLIC_PREFIX.length()));
            } catch (Exception e) {
                log.warn("删除旧头像失败: {}", oldUrl, e);
            }
        }

        return UserConverter.toResponse(user);
    }

    private String extractExt(String name) {
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "png";
        return name.substring(dot + 1);
    }
}
