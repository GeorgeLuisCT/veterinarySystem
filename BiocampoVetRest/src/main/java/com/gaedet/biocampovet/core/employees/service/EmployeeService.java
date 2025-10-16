package com.gaedet.biocampovet.core.employees.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.employees.dto.*;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.entity.EmployeeBranch;
import com.gaedet.biocampovet.core.employees.mapper.EmployeeMapper;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.users.enums.RoleName;
import com.gaedet.biocampovet.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;
    private final EntityManager entityManager;

    public EmployeeService(EmployeeRepository employeeRepository,
                           EmployeeMapper employeeMapper,
                           EntityManager entityManager) {
        this.employeeRepository = employeeRepository;
        this.employeeMapper = employeeMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public EmployeeSummaryResponse createEmployee(EmployeeCreateRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo electrónico ya está en uso");
        }

        List<Branch> allBranches = entityManager.createQuery("SELECT b FROM Branch b", Branch.class)
                .getResultList();

        Employee employee = employeeMapper.toEntity(request, allBranches);
        employeeRepository.save(employee);

        return employeeMapper.toEmployeeSummaryResponse(employee);
    }

    public EmployeeResponse getEmployee(Long id) {
        Employee employee = employeeRepository.findWithDetailsById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        return employeeMapper.toResponse(employee);
    }

    public PaginatedResponse<EmployeeSummaryResponse> getEmployees(int page, int size, Boolean isActive, Long branchId, String query) {
        Pageable pageable = PageRequest.of(page, size);
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();
        Long formattedBranchId = (branchId == null || branchId == 0) ? null : branchId;

        Page<Object[]> rawPage = employeeRepository.findEmployeeSummary(searchQuery, formattedBranchId, isActive, pageable);
        Page<EmployeeSummaryResponse> employeePage = rawPage.map(EmployeeSummaryResponse::fromNativeRow);

        return PaginatedResponse.<EmployeeSummaryResponse>builder()
                .content(employeePage.getContent())
                .totalPages(employeePage.getTotalPages())
                .totalElements(employeePage.getTotalElements())
                .currentPage(employeePage.getNumber())
                .pageSize(employeePage.getSize())
                .build();
    }

    public List<EmployeeQuickSearchResponse> searchEmployeesByName(String name, Long branchId) {
        String searchQuery = (name == null || name.isBlank()) ? null : name.trim();
        Long formattedBranchId = (branchId == null || branchId == 0) ? null : branchId;

        List<Object[]> rawResults = employeeRepository.quickEmployeeSearch(searchQuery, formattedBranchId, true);

        return rawResults.stream()
                .map(EmployeeQuickSearchResponse::fromNativeRow)
                .toList();
    }

    @Transactional
    public EmployeeSummaryResponse updateEmployee(EmployeeUpdateRequest request) {
        Employee employee = employeeRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (employeeRepository.existsByEmailAndIdNot(request.getEmail(), request.getId())) {
            throw new BadRequestException("El correo electrónico ya está en uso por otro empleado");
        }

        employeeMapper.updateEntity(employee, request);

        employeeRepository.save(employee);
        return employeeMapper.toEmployeeSummaryResponse(employee);
    }

    @Transactional
    public void softDeleteEmployee(Long employeeId, Long branchId) {
        Employee employee = employeeRepository.findWithDetailsById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (branchId == null || branchId == 0) {
            employee.getEmployeeBranches().forEach(eb -> eb.setActive(false));
        } else {
            EmployeeBranch eb = employee.getEmployeeBranches().stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este empleado"));
            eb.setActive(false);
        }

        employeeRepository.save(employee);
    }

    @Transactional
    public void hardDeleteEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        employeeRepository.deleteById(employeeId);
    }

    @Transactional
    public EmployeeSummaryResponse restoreEmployee(Long employeeId, Long branchId) {
        Employee employee = employeeRepository.findWithDetailsById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        if (branchId == null || branchId == 0) {
            employee.getEmployeeBranches().forEach(eb -> eb.setActive(true));
        } else {
            EmployeeBranch eb = employee.getEmployeeBranches().stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Sucursal no encontrada para este empleado"));
            eb.setActive(true);
        }

        employeeRepository.save(employee);
        return employeeMapper.toEmployeeSummaryResponse(employee);
    }

    public List<EmployeeSummaryResponse> getEmployeesByUserRolesAndBranch(List<RoleName> roleNames, Long branchId) {
        List<Employee> employees = employeeRepository.findByUserRolesAndBranch(roleNames, branchId);
        return employees.stream()
                .map(employeeMapper::toEmployeeSummaryResponse)
                .toList();
    }
}

