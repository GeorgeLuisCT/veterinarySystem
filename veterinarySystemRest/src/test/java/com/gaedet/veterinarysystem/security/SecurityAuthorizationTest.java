package com.gaedet.veterinarysystem.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Verifica que las reglas de autorización realmente se aplican (antes @PreAuthorize no estaba activado
 * y cualquier usuario autenticado podía ejecutar cualquier operación).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mvc;

    private static RequestPostProcessor as(String role) {
        return user("tester").authorities(new SimpleGrantedAuthority(role));
    }

    private int status(org.springframework.test.web.servlet.RequestBuilder request) throws Exception {
        return mvc.perform(request).andReturn().getResponse().getStatus();
    }

    @Test
    @DisplayName("Sin autenticación no se accede a la API")
    void anonymousIsRejected() throws Exception {
        int status = status(get("/api/sales/pending"));
        assertTrue(status == 401 || status == 403, "esperaba 401/403 y fue " + status);
    }

    @Test
    @DisplayName("Finanzas: recepcionista y veterinario no acceden; administrador sí")
    void financeIsAdminOnly() throws Exception {
        assertEquals(403, status(get("/api/accounts-payable").with(as("ROLE_RECEPTIONIST"))));
        assertEquals(403, status(get("/api/accounts-payable").with(as("ROLE_VETERINARIAN"))));
        assertNotEquals(403, status(get("/api/accounts-payable").with(as("ROLE_ADMIN"))));
    }

    @Test
    @DisplayName("Tesorería: el cajero puede leer cuentas (para cerrar caja) pero no crearlas")
    void treasuryReadForCashierWriteForAdmin() throws Exception {
        assertNotEquals(403, status(get("/api/treasury-accounts").with(as("ROLE_CASHIER"))));
        assertEquals(403, status(post("/api/treasury-accounts").with(as("ROLE_CASHIER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")));
        assertEquals(403, status(get("/api/treasury-accounts").with(as("ROLE_RECEPTIONIST"))));
    }

    @Test
    @DisplayName("Anular ventas solo para administrador y gerente")
    void voidSaleRestricted() throws Exception {
        assertEquals(403, status(post("/api/sales/1/void").with(as("ROLE_RECEPTIONIST"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")));
        assertEquals(403, status(post("/api/sales/1/void").with(as("ROLE_CASHIER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")));
        assertNotEquals(403, status(post("/api/sales/1/void").with(as("ROLE_MANAGER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}")));
    }

    @Test
    @DisplayName("Ventas: el recepcionista puede operar el POS; el almacenista no")
    void salesRoles() throws Exception {
        assertNotEquals(403, status(get("/api/sales/pending").with(as("ROLE_RECEPTIONIST"))));
        assertEquals(403, status(get("/api/sales/pending").with(as("ROLE_WAREHOUSE"))));
    }

    @Test
    @DisplayName("Productos: @PreAuthorize ahora activo; eliminar definitivamente solo admin/gerente")
    void productsHardDeleteRestricted() throws Exception {
        assertEquals(403, status(delete("/api/products/hard-delete").param("id", "1").with(as("ROLE_RECEPTIONIST"))));
        assertEquals(403, status(delete("/api/products/hard-delete").param("id", "1").with(as("ROLE_WAREHOUSE"))));
        assertNotEquals(403, status(delete("/api/products/hard-delete").param("id", "1").with(as("ROLE_MANAGER"))));
    }

    @Test
    @DisplayName("Usuarios: solo administrador lista usuarios")
    void usersAdminOnly() throws Exception {
        assertEquals(403, status(get("/api/user/list").param("active", "true").with(as("ROLE_RECEPTIONIST"))));
        assertNotEquals(403, status(get("/api/user/list").param("active", "true").with(as("ROLE_ADMIN"))));
    }

    @Test
    @DisplayName("Datos clínicos: no accesibles para cajero ni almacenista")
    void clinicalDataRestricted() throws Exception {
        assertEquals(403, status(get("/api/hospitalizations").with(as("ROLE_CASHIER"))));
        assertEquals(403, status(get("/api/clinical-attentions/1").with(as("ROLE_WAREHOUSE"))));
        assertNotEquals(403, status(get("/api/clinical-attentions/1").with(as("ROLE_VETERINARIAN"))));
    }
}
