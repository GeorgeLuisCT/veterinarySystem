package com.gaedet.veterinarysystem.core.users.repository;

import com.gaedet.veterinarysystem.core.users.entity.User;
import com.gaedet.veterinarysystem.core.users.enums.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
        STRING_AGG(DISTINCT b.name, ', ') AS branchNames,
        u.is_active AS active
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN employee_branch eb ON e.id = eb.employee_id
    LEFT JOIN branches b ON eb.branch_id = b.id
    WHERE u.is_active = :isActive
      AND (:branchId IS NULL OR :branchId = 0 OR b.id = :branchId)
      AND (
          :query IS NULL OR
          LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.first_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.last_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(COALESCE(e.phone_number, '')) LIKE LOWER(CONCAT('%', :query, '%'))
      )
    GROUP BY u.id, u.username, e.first_name, e.last_name, e.email, e.phone_number, e.burden, u.is_active
    """,
            countQuery = """
    SELECT COUNT(DISTINCT u.id)
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    LEFT JOIN employee_branch eb ON e.id = eb.employee_id
    LEFT JOIN branches b ON eb.branch_id = b.id
    WHERE u.is_active = :isActive
      AND (:branchId IS NULL OR :branchId = 0 OR b.id = :branchId)
      AND (
          :query IS NULL OR
          LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.first_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.last_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR
          LOWER(COALESCE(e.phone_number, '')) LIKE LOWER(CONCAT('%', :query, '%'))
      )
    """,
            nativeQuery = true)
    Page<Object[]> findRawUserSummaries(@Param("branchId") Long branchId,
                                        @Param("isActive") boolean isActive,
                                        @Param("query") String query,
                                        Pageable pageable);


    Boolean existsByUsername(String username);

    boolean existsByRoles_Name(RoleName roleName);

    /** Administradores activos (para impedir que el sistema se quede sin ninguno). */
    @org.springframework.data.jpa.repository.Query("""
        select count(u) from User u join u.roles r
        where r.name = com.gaedet.veterinarysystem.core.users.enums.RoleName.ROLE_ADMIN and u.isActive = true
    """)
    long countActiveAdmins();
}
