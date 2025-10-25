package com.gaedet.biocampovet.core.employees.repository;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.users.enums.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    @EntityGraph(
            type = EntityGraph.EntityGraphType.LOAD,
            attributePaths = {
                    "employeeBranches",
                    "employeeBranches.branch"
            }
    )
    @Override
    @NonNull
    Page<Employee> findAll(@Nullable Specification<Employee> spec, @NonNull Pageable pageable);

    @Query(value = """
        SELECT 
            e.id,
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email
        FROM employees e
        WHERE (:branchId IS NULL OR EXISTS (
            SELECT 1 FROM employee_branch eb
            WHERE eb.employee_id = e.id AND eb.branch_id = :branchId
        ))
        AND (:isActive IS NULL OR EXISTS (
            SELECT 1 FROM employee_branch eb2
            WHERE eb2.employee_id = e.id AND eb2.active = :isActive
        ))
        AND (
            :query IS NULL OR
            LOWER(e.first_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(e.last_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%'))
        )
        ORDER BY e.last_name
        LIMIT 10
        """,
            nativeQuery = true)
    List<Object[]> quickEmployeeSearch(
            @Param("query") String query,
            @Param("branchId") Long branchId,
            @Param("isActive") Boolean isActive
    );

    @EntityGraph(attributePaths = {
            "employeeBranches",
            "employeeBranches.branch"
    })
    Optional<Employee> findWithDetailsById(Long id);

    @Query("""
    SELECT DISTINCT e FROM Employee e
    JOIN User u ON u.employee = e
    JOIN u.roles r
    JOIN e.employeeBranches eb
    WHERE r.name IN :roleNames
    AND eb.branch.id = :branchId
    AND eb.active = true
""")
    List<Employee> findByUserRolesAndBranch(
            @Param("roleNames") List<RoleName> roleNames,
            @Param("branchId") Long branchId
    );


    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
}
