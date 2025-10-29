package com.gaedet.biocampovet.core.users.repository;

import com.gaedet.biocampovet.core.users.dto.UserSummaryResponse;
import com.gaedet.biocampovet.core.users.entity.User;
import com.gaedet.biocampovet.core.users.enums.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

        @Query("""
      select distinct u
      from User u
      left join fetch u.employee e
      left join fetch e.employeeBranches eb
      left join fetch eb.branch b
      left join fetch u.roles r
      where u.username = :username
    """)
    Optional<User> findAuthBundleByUsername(@Param("username") String username);

    @Query("""
      select distinct u
      from User u
      left join fetch u.roles r
      where u.username = :username
    """)
    Optional<User> findWithRolesByUsername(@Param("username") String username);

    @Query("""
  select distinct u
  from User u
  left join fetch u.employee e
  left join fetch e.employeeBranches eb
  left join fetch eb.branch b
  left join fetch u.roles r
  where u.id = :id
""")
    Optional<User> findAuthBundleById(@Param("id") Long id);

    @Query(value = """
    SELECT 
        u.id AS userId,
        u.username AS username,
        COUNT(DISTINCT ur.role_id) AS cantRoles,
        CONCAT(e.first_name, ' ', e.last_name) AS fullName,
        e.email AS email,
        e.phone_number AS phoneNumber,
        e.burden AS burden,
        STRING_AGG(DISTINCT b.name, ', ') AS branchNames
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN employee_branch eb ON e.id = eb.employee_id
    LEFT JOIN branches b ON eb.branch_id = b.id
    WHERE u.is_active = :isActive
      AND (:branchId IS NULL OR :branchId = 0 OR b.id = :branchId)
    GROUP BY u.id, u.username, e.first_name, e.last_name, e.email, e.phone_number, e.burden
    """,
            countQuery = """
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    LEFT JOIN employee_branch eb ON e.id = eb.employee_id
    LEFT JOIN branches b ON eb.branch_id = b.id
    WHERE u.is_active = :isActive
      AND (:branchId IS NULL OR :branchId = 0 OR b.id = :branchId)
    """,
            nativeQuery = true)
    Page<Object[]> findRawUserSummaries(@Param("branchId") Long branchId, @Param("isActive") boolean isActive, Pageable pageable);


    Boolean existsByUsername(String username);

    boolean existsByRoles_Name(RoleName roleName);
}
