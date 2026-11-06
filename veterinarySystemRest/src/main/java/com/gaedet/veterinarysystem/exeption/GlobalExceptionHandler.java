package com.gaedet.veterinarysystem.exeption;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import javax.persistence.EntityNotFoundException;
import javax.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Traduce las excepciones a respuestas HTTP coherentes: {"error": ..., "message": ...}.
 * Los errores del cliente (4xx) se registran como WARN sin traza; solo los 5xx llevan la traza completa.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static ResponseEntity<Map<String, String>> body(HttpStatus status, String error, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", error);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }

    // ---- 400 -------------------------------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        FieldError firstError = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String message = firstError != null ? firstError.getDefaultMessage()
                : ex.getBindingResult().getAllErrors().stream().findFirst()
                        .map(e -> e.getDefaultMessage()).orElse("Datos inválidos");
        logger.warn("Validación fallida: {}", message);
        return body(HttpStatus.BAD_REQUEST, "Validación fallida", message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream().findFirst()
                .map(v -> v.getMessage()).orElse("Datos inválidos");
        logger.warn("Violación de restricción: {}", message);
        return body(HttpStatus.BAD_REQUEST, "Validación fallida", message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        logger.warn("Cuerpo de la solicitud ilegible: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, "Solicitud incorrecta",
                "El cuerpo de la solicitud es inválido o tiene un formato/valor no permitido");
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> handleBadParameters(Exception ex) {
        logger.warn("Parámetro inválido: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, "Solicitud incorrecta", "Falta un parámetro requerido o tiene un valor inválido");
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(BadRequestException ex) {
        logger.warn("BadRequest: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, "Solicitud incorrecta", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Argumento inválido: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, "Argumento inválido", ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientStock(InsufficientStockException ex) {
        logger.warn("Stock insuficiente: {}", ex.getMessage());
        return body(HttpStatus.BAD_REQUEST, "Stock insuficiente", ex.getMessage());
    }

    // ---- 401 / 403 -------------------------------------------------------------------------------------------

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        logger.warn("Credenciales inválidas");
        return body(HttpStatus.UNAUTHORIZED, "No autorizado", "Usuario o contraseña incorrectos");
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(DisabledException ex) {
        logger.warn("Intento de acceso de usuario desactivado");
        return body(HttpStatus.UNAUTHORIZED, "No autorizado", "El usuario está desactivado. Contacta al administrador");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        logger.warn("Autenticación fallida: {}", ex.getMessage());
        return body(HttpStatus.UNAUTHORIZED, "No autorizado", "No se pudo autenticar la solicitud");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.warn("Acceso denegado: {}", ex.getMessage());
        return body(HttpStatus.FORBIDDEN, "Acceso denegado", "No tienes permisos para realizar esta acción");
    }

    // ---- 404 -------------------------------------------------------------------------------------------------

    @ExceptionHandler({EntityNotFoundException.class, NoSuchElementException.class})
    public ResponseEntity<Map<String, String>> handleNotFoundException(RuntimeException ex) {
        logger.warn("Recurso no encontrado: {}", ex.getMessage());
        return body(HttpStatus.NOT_FOUND, "Recurso no encontrado", ex.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        logger.warn("Error con estado {}: {}", ex.getStatus(), ex.getReason());
        return body(ex.getStatus(), ex.getReason() != null ? ex.getReason() : "Error", ex.getMessage());
    }

    // ---- 409 -------------------------------------------------------------------------------------------------

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        logger.warn("Violación de integridad de datos: {}", ex.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT, "Conflicto de datos",
                "Uno o más valores violan restricciones de la base de datos (duplicado o referencia inexistente)");
    }

    @ExceptionHandler({OptimisticLockingFailureException.class, PessimisticLockingFailureException.class,
            CannotAcquireLockException.class})
    public ResponseEntity<Map<String, String>> handleConcurrency(Exception ex) {
        logger.warn("Conflicto de concurrencia: {}", ex.getMessage());
        return body(HttpStatus.CONFLICT, "Conflicto de concurrencia",
                "El registro fue modificado por otro usuario al mismo tiempo. Actualiza e intenta nuevamente");
    }

    // ---- 500 -------------------------------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        logger.error("Error inesperado:", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno",
                "Ha ocurrido un error inesperado. Intenta nuevamente más tarde.");
    }
}
