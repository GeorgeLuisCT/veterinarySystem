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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserInfoResponse getUserInfo(Long userId, Long branchId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Employee employee = user.getEmployee();

        UserInfoResponse dto = new UserInfoResponse();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet()));
        dto.setEmployeeId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setBurden(employee.getBurden());

        // Setear todas las sucursales del empleado
        dto.setBranches(employee.getEmployeeBranches().stream().map(employeeBranch -> {
            BranchResponse branchResponse = new BranchResponse();
            branchResponse.setId(employeeBranch.getId());
            branchResponse.setName(employeeBranch.getBranch().getName());
            branchResponse.setLocation(employeeBranch.getBranch().getLocation());
            return branchResponse;
        }).collect(Collectors.toSet()));

        // Sucursal seleccionada: si branchId == 0, retornamos una sucursal virtual
        BranchResponse selectedBranchResponse;
        if (branchId == null || branchId == 0L) {
            selectedBranchResponse = new BranchResponse();
            selectedBranchResponse.setId(0L);
            selectedBranchResponse.setName("Todas las sucursales");
            selectedBranchResponse.setLocation("-");
        } else {
            EmployeeBranch employeeBranch = employee.getEmployeeBranches().stream()
                    .filter(eb -> eb.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este usuario"));

            Branch selectedBranch = employeeBranch.getBranch();

            selectedBranchResponse = new BranchResponse();
            selectedBranchResponse.setId(selectedBranch.getId());
            selectedBranchResponse.setName(selectedBranch.getName());
            selectedBranchResponse.setLocation(selectedBranch.getLocation());

        }

        dto.setSelectedBranch(selectedBranchResponse);

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