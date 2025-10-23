package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.dto.CreateFieldRouteDayRequest;
import com.gaedet.biocampovet.core.fieltd.dto.CreateFieldRouteStopRequest;
import com.gaedet.biocampovet.core.fieltd.dto.FieldRouteDayResponse;
import com.gaedet.biocampovet.core.fieltd.entity.FieldRouteDay;
import com.gaedet.biocampovet.core.fieltd.entity.FieldRouteStop;
import com.gaedet.biocampovet.core.fieltd.entity.FieldVisit;
import com.gaedet.biocampovet.core.fieltd.entity.Vehicle;
import com.gaedet.biocampovet.core.fieltd.mapper.RouteMapper;
import com.gaedet.biocampovet.core.fieltd.repository.FieldRouteDayRepository;
import com.gaedet.biocampovet.core.fieltd.repository.FieldRouteStopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldRouteService {
    private final FieldRouteDayRepository dayRepository;
    private final FieldRouteStopRepository stopRepository;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public List<FieldRouteDayResponse> listByDate(LocalDate date) {
        return dayRepository.findByRouteDate(date).stream().map(RouteMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public FieldRouteDayResponse create(CreateFieldRouteDayRequest r) {
        FieldRouteDay day = new FieldRouteDay();
        day.setEmployee(em.getReference(Employee.class, r.getEmployeeId()));
        day.setVehicle(r.getVehicleId() != null ? em.getReference(Vehicle.class, r.getVehicleId()) : null);
        day.setRouteDate(r.getRouteDate());
        dayRepository.save(day);

        if (r.getStops() != null) {
            for (CreateFieldRouteStopRequest s : r.getStops()) {
                FieldRouteStop stop = FieldRouteStop.builder()
                        .routeDay(day)
                        .fieldVisit(em.getReference(FieldVisit.class, s.getFieldVisitId()))
                        .position(s.getPosition())
                        .eta(s.getEta())
                        .build();
                stopRepository.save(stop);
                day.getStops().add(stop);
            }
        }
        return RouteMapper.toResponse(day);
    }
}

