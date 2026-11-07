package com.gaedet.veterinarysystem.core.branches.repository;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import javax.persistence.LockModeType;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findFirstByOrderByIdAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Branch b WHERE b.id = :id")
    Optional<Branch> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT eb.branch FROM EmployeeBranch eb WHERE eb.employee.id = :employeeId")
    List<Branch> findBranchesByEmployeeId(@Param("employeeId") Long employeeId);

    List<Branch> findByNameContainingIgnoreCase(String name);

}