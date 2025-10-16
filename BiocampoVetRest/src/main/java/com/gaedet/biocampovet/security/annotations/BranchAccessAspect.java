package com.gaedet.biocampovet.security.annotations;

import com.gaedet.biocampovet.core.users.enums.RoleName;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
public class BranchAccessAspect {

    private final JwtTokenProvider jwtTokenProvider;

    @Before("@annotation(com.gaedet.biocampovet.security.annotations.BranchAccessRequired) && args(.., branchId)")
    public void validateBranchAccess(JoinPoint joinPoint, Long branchId) {

        boolean isAdminOrManager = jwtTokenProvider.hasAnyRoleEnum(
                List.of(RoleName.ROLE_ADMIN, RoleName.ROLE_MANAGER)
        );

        if (!isAdminOrManager && (branchId == null || branchId == 0)) {
            throw new AccessDeniedException("Debes indicar la sucursal para acceder a los datos.");
        }
    }
}
