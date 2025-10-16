package com.gaedet.biocampovet.security.provider;

import com.gaedet.biocampovet.core.users.enums.RoleName;
import com.gaedet.biocampovet.security.util.JwtUtils;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@Component
public class JwtTokenProvider {
    private final JwtUtils jwtUtils;

    public JwtTokenProvider(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    public Long getUserId() {
        return extractClaim("userId");
    }

    public Long getEmployeeId() {
        return extractClaim("employeeId");
    }

    public Long getBranchId() {
        return extractClaim("branchId");
    }

    private Long extractClaim(String claim) {
        String token = extractToken();
        if (token == null) return null;
        Claims claims = jwtUtils.extractAllClaims(token);
        return claims.get(claim, Long.class);
    }

    public boolean hasAnyRoleEnum(List<RoleName> allowedRoles) {
        List<String> allowed = allowedRoles.stream().map(Enum::name).toList();
        return hasAnyRole(allowed);
    }

    public boolean hasAnyRole(List<String> allowedRoles) {
        String token = extractToken();
        if (token == null) return false;
        List<String> userRoles = jwtUtils.extractRoles(token);
        return userRoles.stream().anyMatch(allowedRoles::contains);
    }

    private String extractToken() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) return null;
        HttpServletRequest request = attributes.getRequest();
        String header = request.getHeader("Authorization");
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }
}
