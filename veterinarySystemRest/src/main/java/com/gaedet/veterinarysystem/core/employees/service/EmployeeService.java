package com.gaedet.veterinarysystem.core.employees.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.dto.*;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import com.gaedet.veterinarysystem.core.employees.mapper.EmployeeMapper;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.employees.specs.EmployeeSpecs;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.List;
import javax.persistence.EntityNotFoundException;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EntityManager entityManager;

    public EmployeeService(EmployeeRepository employeeRepository,
                           EntityManager entityManager) {
        this.employeeRepository = employeeRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public EmployeeSummaryResponse createEmployee(EmployeeCreateRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo electrónico ya está en uso");
        }

        List<Branch> allBranches = entityManager.createQuery("SELECT b FROM Branch b", Branch.class)
                .getResultList();

        Employee employee = EmployeeMapper.toEntity(request, allBranches);
        employeeRepository.save(employee);

        return EmployeeMapper.toSummary(employee);
    }


    public EmployeeResponse getEmployee(Long id) {
        Employee employee = employeeRepository.findWithDetailsById(id)
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));
        return EmployeeMapper.toResponse(employee);
    }

    public PaginatedResponse<EmployeeSummaryResponse> list(
            int page, int size,
            String q,
            Long branchId,
            Boolean active
    ) {
        Specification<Employee> spec = EmployeeSpecs.byFilters(q, branchId, active);

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1),
                Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));

        Page<Employee> result = employeeRepository.findAll(spec, pageable);

        List<EmployeeSummaryResponse> content = result.getContent().stream()
                .map(EmployeeMapper::toSummary)
                .toList();

        return PaginatedResponse.<EmployeeSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
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
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));

        if (employeeRepository.existsByEmailAndIdNot(request.getEmail(), request.getId())) {
            throw new BadRequestException("El correo electrónico ya está en uso por otro empleado");
        }

        EmployeeMapper.updateEntity(employee, request);

        employeeRepository.save(employee);
        return EmployeeMapper.toSummary(employee);
    }

    @Transactional
    public void softDeleteEmployee(Long employeeId, Long branchId) {
        Employee employee = employeeRepository.findWithDetailsById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));

        if (branchId == null || branchId == 0) {
            employee.getEmployeeBranches().forEach(eb -> eb.setActive(false));
        } else {
            EmployeeBranch eb = employee.getEmployeeBranches().stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada para este empleado"));
            eb.setActive(false);
        }

        employeeRepository.save(employee);
    }

    @Transactional
    public void hardDeleteEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));

        employeeRepository.deleteById(employeeId);
    }

    @Transactional
    public EmployeeSummaryResponse restoreEmployee(Long employeeId, Long branchId) {
        Employee employee = employeeRepository.findWithDetailsById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Empleado no encontrado"));

        if (branchId == null || branchId == 0) {
            employee.getEmployeeBranches().forEach(eb -> eb.setActive(true));
        } else {
            EmployeeBranch eb = employee.getEmployeeBranches().stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .findFirst()
                    .orElseThrow(() -> new EntityNotFoundException("Sucursal no encontrada para este empleado"));
            eb.setActive(true);
        }

        employeeRepository.save(employee);
        return EmployeeMapper.toSummary(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeSummaryResponse> getEmployeesByUserRolesAndBranch(List<RoleName> roleNames, Long branchId) {
        List<Employee> employees = employeeRepository.findByUserRolesAndBranch(roleNames, branchId);
        return employees.stream()
                .map(EmployeeMapper::toSummary)
                .toList();
    }
}

