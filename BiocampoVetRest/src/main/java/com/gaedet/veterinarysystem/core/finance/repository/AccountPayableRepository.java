package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long>, JpaSpecificationExecutor<AccountPayable> {
}
