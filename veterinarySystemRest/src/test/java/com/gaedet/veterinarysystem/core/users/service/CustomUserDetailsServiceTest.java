package com.gaedet.veterinarysystem.core.users.service;

import com.gaedet.veterinarysystem.core.users.entity.Role;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private User user(boolean active) {
        Role role = new Role();
        role.setName(RoleName.ROLE_CASHIER);
        User u = new User();
        u.setUsername("caja1");
        u.setPassword("hash");
        u.setActive(active);
        u.setRoles(Set.of(role));
        return u;
    }

    @Test
    void inactiveUserCannotAuthenticate() {
        when(userRepository.findWithRolesByUsername("caja1")).thenReturn(Optional.of(user(false)));
        UserDetails details = new CustomUserDetailsService(userRepository).loadUserByUsername("caja1");
        assertFalse(details.isEnabled(), "un usuario desactivado debe quedar deshabilitado");
    }

    @Test
    void activeUserIsEnabled() {
        when(userRepository.findWithRolesByUsername("caja1")).thenReturn(Optional.of(user(true)));
        UserDetails details = new CustomUserDetailsService(userRepository).loadUserByUsername("caja1");
        assertTrue(details.isEnabled());
    }
}
