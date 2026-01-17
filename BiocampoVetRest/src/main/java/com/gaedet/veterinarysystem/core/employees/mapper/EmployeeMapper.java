package com.gaedet.veterinarysystem.core.employees.mapper;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.dto.*;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class EmployeeMapper {


    public static Employee toEntity(EmployeeCreateRequest request, List<Branch> allBranches) {
        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setBurden(request.getBurden());

        Set<Long> activeBranchIds = new HashSet<>(request.getBranchIds());

        Set<EmployeeBranch> employeeBranches = allBranches.stream()
                .map(branch -> {
                    EmployeeBranch eb = new EmployeeBranch();
                    eb.setEmployee(employee);
                    eb.setBranch(branch);
                    eb.setActive(activeBranchIds.contains(branch.getId()));
                    return eb;
                })
                .collect(Collectors.toSet());

        employee.setEmployeeBranches(employeeBranches);

        return employee;
    }

    public static EmployeeResponse toResponse(Employee employee) {
        List<EmployeeBranchResponse> branchResponses = employee.getEmployeeBranches().stream()
                .map(eb -> EmployeeBranchResponse.builder()
                        .id(eb.getBranch().getId())
                        .branchId(eb.getBranch().getId())
                        .branchName(eb.getBranch().getName())
                        .active(eb.isActive())
                        .build())
                .toList();

        return EmployeeResponse.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phoneNumber(employee.getPhoneNumber())
                .burden(employee.getBurden())
                .branches(branchResponses)
                .build();
    }

    public static EmployeeSummaryResponse toSummary(Employee employee) {
        String branchNames = employee.getEmployeeBranches().stream()
                .map(eb -> eb.getBranch().getName())
                .distinct()
                .collect(Collectors.joining(", "));

        boolean isActive = employee.getEmployeeBranches().stream()
                .allMatch(EmployeeBranch::isActive);

        return new EmployeeSummaryResponse(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getPhoneNumber(),
                employee.getBurden(),
                branchNames,
                isActive
        );
    }

    public static void updateEntity(Employee employee, EmployeeUpdateRequest request) {
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setBurden(request.getBurden());
    }
}
