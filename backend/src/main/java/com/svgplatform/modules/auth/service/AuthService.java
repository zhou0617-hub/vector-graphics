package com.svgplatform.modules.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import com.svgplatform.modules.auth.dto.LoginRequest;
import com.svgplatform.modules.auth.dto.LoginResponse;
import com.svgplatform.modules.auth.dto.RegisterRequest;
import com.svgplatform.modules.user.converter.UserConverter;
import com.svgplatform.modules.user.dto.UserResponse;
import com.svgplatform.modules.user.entity.User;
import com.svgplatform.modules.user.repository.UserMapper;
import com.svgplatform.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public LoginResponse register(RegisterRequest req) {
        Long emailCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail())
        );
        if (emailCount != null && emailCount > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "邮箱已被注册");
        }

        Long usernameCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getUsername())
        );
        if (usernameCount != null && usernameCount > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "用户名已被占用");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole("user");
        user.setStatus("active");

        userMapper.insert(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserResponse resp = UserConverter.toResponse(user);
        return new LoginResponse(token, resp);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, req.getEmail())
        );
        if (user == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "邮箱或密码错误");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "邮箱或密码错误");
        }
        if (!"active".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "账号已被禁用");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserResponse resp = UserConverter.toResponse(user);
        return new LoginResponse(token, resp);
    }
}
