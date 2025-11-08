package com.gaedet.biocampovet.core.finance.repository;

import com.gaedet.biocampovet.core.finance.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long>, JpaSpecificationExecutor<AccountPayable> {
}
