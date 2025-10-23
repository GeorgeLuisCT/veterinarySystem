package com.gaedet.biocampovet.core.fieltd.controller;

import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.service.VehicleService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/fieldwork/vehicles")
@RequiredArgsConstructor
@Validated
public class VehicleController {
    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> list() { return ResponseEntity.ok(vehicleService.listAll()); }
    @GetMapping("/detail")
    public ResponseEntity<VehicleResponse> get(@RequestParam Long id) { return ResponseEntity.ok(vehicleService.get(id)); }
    @GetMapping("/quick-search")
    public ResponseEntity<List<VehicleQuickSearchResponse>> quickSearch(@RequestParam(required = false) String q,
                                                                        @RequestParam(required = false) Boolean onlyActive) {
        return ResponseEntity.ok(vehicleService.quickSearch(q, onlyActive));
    }
    @PostMapping
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody CreateVehicleRequest r) { return ResponseEntity.ok(vehicleService.create(r)); }
    @PutMapping
    public ResponseEntity<VehicleResponse> update(@RequestParam Long id, @Valid @RequestBody UpdateVehicleRequest r) { return ResponseEntity.ok(vehicleService.update(id, r)); }
    @DeleteMapping
    public ResponseEntity<VehicleResponse> delete(@RequestParam Long id) { return ResponseEntity.ok(vehicleService.delete(id)); }

    @GetMapping("/stock")
    public ResponseEntity<List<VehicleStockResponse>> getVehicleStock(@RequestParam Long vehicleId) { return ResponseEntity.ok(vehicleService.getVehicleStock(vehicleId)); }
    @PostMapping("/stock/adjust")
    public ResponseEntity<VehicleStockResponse> adjustStock(@Valid @RequestBody AdjustVehicleStockRequest r, @RequestParam(required = false) Long employeeId) { return ResponseEntity.ok(vehicleService.adjustVehicleStock(r, employeeId)); }
    @GetMapping("/movements")
    public ResponseEntity<PaginatedResponse<ProductStockMovementResponse>> listMovements(@RequestParam(required = false) Long vehicleId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) { return ResponseEntity.ok(vehicleService.listMovements(vehicleId, page, size)); }

    @PostMapping("/pings")
    public ResponseEntity<VehiclePingResponse> createPing(@Valid @RequestBody CreateVehiclePingRequest r) { return ResponseEntity.ok(vehicleService.createPing(r)); }
    @GetMapping("/pings")
    public ResponseEntity<PaginatedResponse<VehiclePingResponse>> listPings(@RequestParam Long vehicleId, @RequestParam LocalDateTime from, @RequestParam LocalDateTime to, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) { return ResponseEntity.ok(vehicleService.listPings(vehicleId, from, to, page, size)); }
}
