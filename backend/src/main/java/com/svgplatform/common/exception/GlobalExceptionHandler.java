package com.svgplatform.common.exception;

import com.svgplatform.common.constant.ErrorCode;
import com.svgplatform.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String msg = fieldError != null ? fieldError.getDefaultMessage() : "参数错误";
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST, msg));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleJsonParse(HttpMessageNotReadableException e) {
        log.warn("请求体解析失败: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST, "请求体格式错误"));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException e) {
        log.warn("缺少请求参数: {}", e.getParameterName());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST, "缺少参数: " + e.getParameterName()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("参数类型不匹配: {} = {}", e.getName(), e.getValue());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST, "参数类型错误: " + e.getName()));
    }

    @ExceptionHandler({
        org.springframework.web.context.request.async.AsyncRequestNotUsableException.class,
        java.io.IOException.class
    })
    public void handleClientDisconnect(Exception e) {
        String msg = e.getMessage() == null ? "" : e.getMessage();
        if (msg.contains("Connection has been closed")
            || msg.contains("Broken pipe")
            || msg.contains("connection reset")
            || msg.contains("Connection reset")) {
            log.debug("客户端断开连接（用户可能取消了请求）");
            return;
        }
        log.warn("IO 异常: {}", msg);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception e) {
        log.error("未处理异常", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR, "服务器内部错误"));
    }
}