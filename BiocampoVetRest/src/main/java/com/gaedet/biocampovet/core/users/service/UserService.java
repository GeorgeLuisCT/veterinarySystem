package com.gaedet.biocampovet.core.users.service;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.entity.Company;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.entity.EmployeeBranch;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.users.dto.UserInfoResponse;
import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserInfoResponse getUserInfo(Long userId, Long branchId) {
        User user = userRepository.findAuthBundleById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Employee employee = user.getEmployee();

        UserInfoResponse dto = new UserInfoResponse();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRoles(user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet()));
        dto.setEmployeeId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setBurden(employee.getBurden());

        dto.setBranches(employee.getEmployeeBranches().stream()
                .map(eb -> {
                    Branch b = eb.getBranch();
                    BranchResponse br = new BranchResponse();
                    br.setId(b.getId());
                    br.setName(b.getName());
                    br.setLocation(b.getLocation());
                    return br;
                })
                .collect(Collectors.toSet())
        );

        BranchResponse selected;
        if (branchId == null || branchId == 0L) {
            selected = new BranchResponse(0L, "Todas las sucursales", "-");
        } else {
            Branch selectedBranch = employee.getEmployeeBranches().stream()
                    .map(EmployeeBranch::getBranch)
                    .filter(b -> b.getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este usuario"));

            selected = new BranchResponse(selectedBranch.getId(), selectedBranch.getName(), selectedBranch.getLocation());
        }

        dto.setSelectedBranch(selected);
        return dto;
    }

    public PaginatedResponse<UserSummaryResponse> getAllUsers(Long branchId, boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Object[]> rawPage = userRepository.findRawUserSummaries(branchId, isActive, pageable);

        Page<UserSummaryResponse> resultPage = rawPage.map(UserSummaryResponse::fromNativeRow);

        return PaginatedResponse.<UserSummaryResponse>builder()
                .content(resultPage.getContent())
                .totalPages(resultPage.getTotalPages())
                .totalElements(resultPage.getTotalElements())
                .currentPage(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .build();
    }
}