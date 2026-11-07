package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import javax.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long>, JpaSpecificationExecutor<AccountPayable> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountPayable a WHERE a.id = :id")
    Optional<AccountPayable> findByIdForUpdate(@Param("id") Long id);
}
