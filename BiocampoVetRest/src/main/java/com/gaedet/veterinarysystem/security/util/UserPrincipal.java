package com.gaedet.veterinarysystem.security.util;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;

@Getter
public class UserPrincipal implements UserDetails {

    private Long userId;
    private Long employeeId;
    private Long branchId;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long userId, Long employeeId, Long branchId, String username, Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.employeeId = employeeId;
        this.branchId = branchId;
        this.username = username;
        this.authorities = authorities;
    }

    // Métodos de UserDetails
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}