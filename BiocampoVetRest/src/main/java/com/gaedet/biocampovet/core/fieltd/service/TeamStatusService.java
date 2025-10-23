package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.dto.SetTeamStatusRequest;
import com.gaedet.biocampovet.core.fieltd.dto.TeamStatusResponse;
import com.gaedet.biocampovet.core.fieltd.entity.FieldTeamStatusEntity;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisit;
import com.gaedet.biocampovet.core.fieltd.mapper.TeamStatusMapper;
import com.gaedet.biocampovet.core.fieltd.repository.FieldTeamStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamStatusService {
    private final FieldTeamStatusRepository teamStatusRepository;
    private final EntityManager em;

    @Transactional
    public TeamStatusResponse setStatus(SetTeamStatusRequest r) {
        FieldTeamStatusEntity e = teamStatusRepository.findByEmployee_Id(r.getEmployeeId()).orElseGet(() ->
                FieldTeamStatusEntity.builder().employee(em.getReference(Employee.class, r.getEmployeeId())).build()
        );
        e.setStatus(r.getStatus());
        e.setCurrentVisit(r.getCurrentVisitId() != null ? em.getReference(FieldVisit.class, r.getCurrentVisitId()) : null);
        e.setLocationText(r.getLocationText());
        e.setGpsCoordinates(r.getGpsCoordinates());
        teamStatusRepository.save(e);
        return TeamStatusMapper.toResponse(e);
    }

    @Transactional(readOnly = true)
    public List<TeamStatusResponse> listAll() {
        return teamStatusRepository.findAll().stream().map(TeamStatusMapper::toResponse).collect(Collectors.toList());
    }
}

