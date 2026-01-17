package com.gaedet.veterinarysystem.core.fieltd.controller;

import com.gaedet.veterinarysystem.core.fieltd.dto.CreateFieldRouteDayRequest;
import com.gaedet.veterinarysystem.core.fieltd.dto.FieldRouteDayResponse;
import com.gaedet.veterinarysystem.core.fieltd.service.FieldRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/fieldwork/route-days")
@RequiredArgsConstructor
@Validated
public class FieldRouteController {
    private final FieldRouteService fieldRouteService;

    @GetMapping
    public ResponseEntity<List<FieldRouteDayResponse>> listByDate(@RequestParam LocalDate date) {
        return ResponseEntity.ok(fieldRouteService.listByDate(date));
    }

    @PostMapping
    public ResponseEntity<FieldRouteDayResponse> create(@Valid @RequestBody CreateFieldRouteDayRequest r) {
        return ResponseEntity.ok(fieldRouteService.create(r));
    }
}

