package com.svgplatform.common.exception;

import com.svgplatform.common.constant.ErrorCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = ErrorCode.BAD_REQUEST;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
