package com.interpolation.controller;

import com.interpolation.model.InterpolationResult;
import com.interpolation.validation.ValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleMalformedJson(HttpMessageNotReadableException e) {
        String msg = "Некорректный формат JSON. Убедитесь, что все значения являются числами, а не строками.";
        if (e.getMessage() != null && e.getMessage().contains("Cannot deserialize value of type")) {
            msg = "Ошибка разбора данных: ожидалось число, получено текстовое значение. Проверьте введённые данные.";
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgument(MethodArgumentNotValidException e) {
        StringBuilder sb = new StringBuilder();
        e.getBindingResult().getAllErrors().forEach(err -> sb.append(err.getDefaultMessage()).append("; "));
        return ResponseEntity.badRequest().body(Map.of("success", false, "error", sb.toString()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleFileTooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of(
                "success", false,
                "error", "Файл слишком большой. Максимально допустимый размер: 1 МБ"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception e) {
        return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Внутренняя ошибка сервера: " + e.getMessage()
        ));
    }
}
