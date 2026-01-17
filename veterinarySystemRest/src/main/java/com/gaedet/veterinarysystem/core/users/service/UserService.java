package com.gaedet.veterinarysystem.core.users.service;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserDetailResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserInfoResponse;
import com.gaedet.veterinarysystem.core.users.dto.UserSummaryResponse;
import com.gaedet.veterinarysystem.core.users.entity.Role;
import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.mapper.UserMapper;
import com.gaedet.veterinarysystem.core.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
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

    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findAuthBundleById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Employee employee = user.getEmployee();

        return UserDetailResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .active(user.isActive())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .employeeId(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phoneNumber(employee.getPhoneNumber())
                .burden(employee.getBurden())
                .branches(employee.getEmployeeBranches().stream()
                        .map(eb -> {
                            Branch branch = eb.getBranch();
                            return new BranchResponse(branch.getId(), branch.getName(), branch.getLocation());
                        })
                        .collect(Collectors.toSet()))
                .build();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<UserSummaryResponse> getAllUsers(Long branchId,
                                                              boolean isActive,
                                                              int page,
                                                              int size,
                                                              String query) {
        Pageable pageable = PageRequest.of(page, size);
        String normalizedQuery = StringUtils.hasText(query) ? query.trim() : null;
        Page<Object[]> rawPage = userRepository.findRawUserSummaries(branchId, isActive, normalizedQuery, pageable);

        var resultPage = rawPage.map(UserSummaryResponse::fromNativeRow);

        return PaginatedResponse.<UserSummaryResponse>builder()
                .content(resultPage.getContent())
                .totalPages(resultPage.getTotalPages())
                .totalElements(resultPage.getTotalElements())
                .currentPage(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .build();
    }

    @Transactional
    public UserSummaryResponse updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findAuthBundleById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        User saved = userRepository.save(user);
        return userMapper.toSummary(saved);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findAuthBundleById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Employee employee = user.getEmployee();
        boolean hasActiveAssignments = employee != null &&
                employee.getEmployeeBranches().stream()
                        .anyMatch(EmployeeBranch::isActive);

        if (hasActiveAssignments) {
            throw new IllegalStateException("No se puede eliminar el usuario porque el empleado asociado tiene sucursales activas.");
        }

        userRepository.deleteById(userId);
    }
}
