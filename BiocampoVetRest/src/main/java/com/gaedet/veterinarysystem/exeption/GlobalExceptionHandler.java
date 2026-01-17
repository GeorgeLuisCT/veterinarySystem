package com.gaedet.veterinarysystem.exeption;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 🔹 Validaciones con @Valid (formulario)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        logger.error("Error de validación:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Validación fallida");

        // Solo devuelve el primer error
        FieldError firstError = ex.getBindingResult().getFieldErrors().get(0);
        response.put("message", firstError.getDefaultMessage());

        return ResponseEntity.badRequest().body(response);
    }

    // 🔹 Excepciones personalizadas
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(BadRequestException ex) {
        logger.error("Error BadRequest:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Solicitud incorrecta");
        response.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    // 🔹 Recurso no encontrado
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFoundException(NoSuchElementException ex) {
        logger.error("Recurso no encontrado:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Recurso no encontrado");
        response.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // 🔹 Argumento inválido
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.error("Argumento inválido:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Argumento inválido");
        response.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    // 🔹 Acceso denegado
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.error("Acceso denegado:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Acceso denegado");
        response.put("message", "No tienes permisos para realizar esta acción");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // 🔹 Excepciones con ResponseStatusException
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        logger.error("Error con estado:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", ex.getReason() != null ? ex.getReason() : "Error");
        response.put("message", ex.getMessage());

        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    // 🔹 Violaciones de integridad de datos
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        logger.error("Violación de integridad de datos:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Error de base de datos");
        response.put("message", "Uno o más valores violan restricciones de la base de datos");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    // 🔹 Stock insuficiente
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientStock(InsufficientStockException ex) {
        logger.warn("Stock insuficiente:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Stock insuficiente");
        response.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // 🔹 Fallback general para errores no controlados
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        logger.error("Error inesperado:", ex);

        Map<String, String> response = new HashMap<>();
        response.put("error", "Error interno");
        response.put("message", "Ha ocurrido un error inesperado. Intenta nuevamente más tarde.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}