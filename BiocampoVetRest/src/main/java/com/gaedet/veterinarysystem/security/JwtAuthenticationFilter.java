package com.gaedet.veterinarysystem.security;


import com.gaedet.veterinarysystem.security.util.JwtUtils;
import com.gaedet.veterinarysystem.security.util.UserPrincipal;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.stream.Collectors;



import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Autowired
    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = jwtUtils.extractToken(request);
        if (token != null && jwtUtils.validateToken(token)) {

            Claims claims = jwtUtils.extractAllClaims(token);
            String username = claims.getSubject();
            Long userId = claims.get("userId", Long.class);
            Long employeeId = claims.get("employeeId", Long.class);
            Long branchId = claims.get("branchId", Long.class);
            List<String> roles = claims.get("roles", List.class);

            List<GrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            UserPrincipal principal = new UserPrincipal(
                    userId,
                    employeeId,
                    branchId,
                    username,
                    authorities
            );

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }

}
