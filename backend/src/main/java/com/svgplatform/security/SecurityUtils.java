package com.svgplatform.security;

import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal p) {
            return p;
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED, "未登录");
    }

    public static Long currentUserId() {
        return currentUser().getId();
    }
}
