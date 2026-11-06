package com.gaedet.veterinarysystem.core.publicportal.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PublicPortalRateLimiterTest {

    @Test
    void blocksAfterMaxAttemptsForTheSameKey() {
        PublicPortalRateLimiter limiter = new PublicPortalRateLimiter();
        for (int i = 0; i < PublicPortalRateLimiter.MAX_ATTEMPTS; i++) {
            limiter.check("doc:12345678");
        }

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> limiter.check("doc:12345678"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
    }

    @Test
    void differentKeysDoNotShareTheBudget() {
        PublicPortalRateLimiter limiter = new PublicPortalRateLimiter();
        for (int i = 0; i < PublicPortalRateLimiter.MAX_ATTEMPTS; i++) {
            limiter.check("doc:1");
        }
        assertDoesNotThrow(() -> limiter.check("doc:2"));
    }
}
