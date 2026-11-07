package com.gaedet.veterinarysystem.core.employees.controller;

import com.gaedet.veterinarysystem.core.employees.dto.*;
import com.gaedet.veterinarysystem.core.employees.service.EmployeeService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final JwtTokenProvider jwtTokenProvider;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/create")
    public ResponseEntity<EmployeeSummaryResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }

    @GetMapping("/get")
    public ResponseEntity<EmployeeResponse> getEmployee(@RequestParam Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<EmployeeSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Boolean active
    ) {
        var resp = employeeService.list(page, size, q, branchId, active);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<EmployeeQuickSearchResponse>> searchEmployeesByName(
            @RequestParam String name,
            @RequestParam(required = false) Long branchId
    ) {
        return ResponseEntity.ok(employeeService.searchEmployeesByName(name, branchId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/update")
    public ResponseEntity<EmployeeSummaryResponse> updateEmployee(@RequestBody @Valid EmployeeUpdateRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/soft-delete")
    public ResponseEntity<Map<String, String>> softDeleteEmployee(@RequestParam Long id,
                                                                  @RequestParam(required = false) Long branchId) {
        employeeService.softDeleteEmployee(id, branchId);
        return ResponseEntity.ok(Map.of("message", "Empleado desactivado correctamente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/hard-delete")
    public ResponseEntity<Map<String, String>> hardDeleteEmployee(@RequestParam Long id) {
        employeeService.hardDeleteEmployee(id);
        return ResponseEntity.ok(Map.of("message", "Empleado eliminado permanentemente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/restore")
    public ResponseEntity<EmployeeSummaryResponse> restoreEmployee(@RequestParam Long id,
                                                                   @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(employeeService.restoreEmployee(id, branchId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERVISOR', 'VETERINARIAN', 'ASSISTANT', 'CASHIER', 'RECEPTIONIST', 'GROOMER')")
    @GetMapping("/by-roles")
    public ResponseEntity<List<EmployeeSummaryResponse>> getEmployeesByRoles(
            @RequestParam List<RoleName> roles) {

        Long branchId = jwtTokenProvider.getBranchId();
        if (branchId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<EmployeeSummaryResponse> employees = employeeService.getEmployeesByUserRolesAndBranch(roles, branchId);
        return ResponseEntity.ok(employees);
    }
}
