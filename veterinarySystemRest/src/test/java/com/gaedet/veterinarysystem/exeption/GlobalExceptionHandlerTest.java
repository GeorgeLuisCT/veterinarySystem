package com.gaedet.veterinarysystem.exeption;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.persistence.EntityNotFoundException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class ThrowingController {
        @GetMapping("/t/not-found")
        void notFound() { throw new EntityNotFoundException("Venta no encontrada"); }

        @GetMapping("/t/bad-request")
        void badRequest() { throw new BadRequestException("Monto inválido"); }

        @GetMapping("/t/credentials")
        void credentials() { throw new BadCredentialsException("x"); }

        @GetMapping("/t/stock")
        void stock() { throw new InsufficientStockException("Sin stock"); }

        @GetMapping("/t/boom")
        void boom() { throw new IllegalStateException("detalle interno"); }
    }

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void entityNotFoundIs404() throws Exception {
        mvc.perform(get("/t/not-found")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Venta no encontrada"));
    }

    @Test
    void badRequestIs400() throws Exception {
        mvc.perform(get("/t/bad-request")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Monto inválido"));
    }

    @Test
    void badCredentialsIs401() throws Exception {
        mvc.perform(get("/t/credentials")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void insufficientStockIs400() throws Exception {
        mvc.perform(get("/t/stock")).andExpect(status().isBadRequest());
    }

    @Test
    void unexpectedErrorDoesNotLeakDetails() throws Exception {
        mvc.perform(get("/t/boom")).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Ha ocurrido un error inesperado. Intenta nuevamente más tarde."));
    }
}
