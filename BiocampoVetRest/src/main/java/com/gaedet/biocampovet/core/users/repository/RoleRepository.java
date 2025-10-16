package com.gaedet.biocampovet.core.users.repository;

import com.gaedet.biocampovet.core.users.entity.Role;
import com.gaedet.biocampovet.core.users.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName roleName);
}
