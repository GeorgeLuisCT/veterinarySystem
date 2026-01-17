package com.gaedet.veterinarysystem.core.branches.repository;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findFirstByOrderByIdAsc();

    @Query("SELECT eb.branch FROM EmployeeBranch eb WHERE eb.employee.id = :employeeId")
    List<Branch> findBranchesByEmployeeId(@Param("employeeId") Long employeeId);

    List<Branch> findByNameContainingIgnoreCase(String name);

}