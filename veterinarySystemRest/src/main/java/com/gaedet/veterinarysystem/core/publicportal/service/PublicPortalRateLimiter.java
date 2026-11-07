package com.gaedet.veterinarysystem.core.publicportal.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Límite de intentos para el portal público (sin login): el documento de identidad no es un secreto,
 * así que se frena la consulta masiva/enumeración por IP y por documento (ventana deslizante en memoria).
 */
@Component
public class PublicPortalRateLimiter {

    static final int MAX_ATTEMPTS = 10;
    static final Duration WINDOW = Duration.ofMinutes(10);

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    /** Registra un intento para la clave y lanza 429 si superó el máximo dentro de la ventana. */
    public void check(String key) {
        long now = System.currentTimeMillis();
        long threshold = now - WINDOW.toMillis();
        Deque<Long> deque = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst() < threshold) {
                deque.pollFirst();
            }
            if (deque.size() >= MAX_ATTEMPTS) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Demasiados intentos. Espera unos minutos antes de volver a consultar.");
            }
            deque.addLast(now);
        }
        if (attempts.size() > 10_000) {
            attempts.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    return e.getValue().isEmpty() || e.getValue().peekLast() < threshold;
                }
            });
        }
    }
}
