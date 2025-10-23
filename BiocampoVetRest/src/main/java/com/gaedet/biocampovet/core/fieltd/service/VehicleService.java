package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.entity.ProductStockMovement;
import com.gaedet.biocampovet.core.fieltd.entity.ProductVehicleStock;
import com.gaedet.biocampovet.core.fieltd.entity.Vehicle;
import com.gaedet.biocampovet.core.fieltd.entity.VehicleLocationPing;
import com.gaedet.biocampovet.core.fieltd.enums.StockLocationType;
import com.gaedet.biocampovet.core.fieltd.enums.StockMovementType;
import com.gaedet.biocampovet.core.fieltd.mapper.StockMapper;
import com.gaedet.biocampovet.core.fieltd.mapper.VehicleMapper;
import com.gaedet.biocampovet.core.fieltd.repository.*;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final VehicleLocationPingRepository pingRepository;
    private final ProductVehicleStockRepository productVehicleStockRepository;
    private final ProductStockMovementRepository productStockMovementRepository;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public List<VehicleResponse> listAll() {
        return vehicleRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(VehicleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse get(Long id) {
        Vehicle v = vehicleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        return VehicleMapper.toResponse(v);
    }

    @Transactional
    public VehicleResponse create(CreateVehicleRequest r) {
        if (vehicleRepository.existsByNameIgnoreCase(r.getName().trim())) {
            throw new IllegalArgumentException("Ya existe un vehículo con ese nombre");
        }
        Vehicle v = new Vehicle();
        v.setName(r.getName().trim());
        v.setLicensePlate(r.getLicensePlate());
        v.setAssignedVet(r.getAssignedVetEmployeeId() != null ? em.getReference(Employee.class, r.getAssignedVetEmployeeId()) : null);
        v.setHomeBranch(r.getHomeBranchId() != null ? em.getReference(Branch.class, r.getHomeBranchId()) : null);
        if (r.getActive() != null) v.setActive(r.getActive());
        return VehicleMapper.toResponse(vehicleRepository.save(v));
    }

    @Transactional
    public VehicleResponse update(Long id, UpdateVehicleRequest r) {
        Vehicle v = vehicleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        String newName = r.getName().trim();
        if (!v.getName().equalsIgnoreCase(newName) && vehicleRepository.existsByNameIgnoreCaseAndIdNot(newName, id)) {
            throw new IllegalArgumentException("Ya existe un vehículo con ese nombre");
        }
        v.setName(newName);
        v.setLicensePlate(r.getLicensePlate());
        v.setAssignedVet(r.getAssignedVetEmployeeId() != null ? em.getReference(Employee.class, r.getAssignedVetEmployeeId()) : null);
        v.setHomeBranch(r.getHomeBranchId() != null ? em.getReference(Branch.class, r.getHomeBranchId()) : null);
        if (r.getActive() != null) v.setActive(r.getActive());
        return VehicleMapper.toResponse(v);
    }

    @Transactional
    public VehicleResponse delete(Long id) {
        Vehicle v = vehicleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        VehicleResponse out = VehicleMapper.toResponse(v);
        vehicleRepository.delete(v);
        return out;
    }

    @Transactional(readOnly = true)
    public List<VehicleStockResponse> getVehicleStock(Long vehicleId) {
        return productVehicleStockRepository.findByVehicle_Id(vehicleId).stream().map(StockMapper::toVehicleStock).collect(Collectors.toList());
    }

    @Transactional
    public VehicleStockResponse adjustVehicleStock(AdjustVehicleStockRequest r, Long employeeId) {
        Vehicle vehicle = em.getReference(Vehicle.class, r.getVehicleId());
        Product product = em.getReference(Product.class, r.getProductId());
        ProductVehicleStock pvs = productVehicleStockRepository.findByVehicle_IdAndProduct_Id(vehicle.getId(), product.getId())
                .orElseGet(() -> ProductVehicleStock.builder()
                        .vehicle(vehicle)
                        .product(product)
                        .unit(product.getUnitType())
                        .quantity(0)
                        .build());
        var targetUnit = r.getUnit() != null ? r.getUnit() : (pvs.getUnit() != null ? pvs.getUnit() : product.getUnitType());
        if (pvs.getUnit() != null && targetUnit != null && pvs.getUnit() != targetUnit) {
            throw new IllegalArgumentException("La unidad indicada no coincide con la unidad registrada en el vehículo.");
        }
        if (targetUnit == null) {
            targetUnit = product.getUnitType();
        }
        pvs.setUnit(targetUnit);
        pvs.setQuantity((pvs.getQuantity() == null ? 0 : pvs.getQuantity()) + r.getQuantityDelta());
        productVehicleStockRepository.save(pvs);

        ProductStockMovement move = ProductStockMovement.builder()
                .movementType(r.getQuantityDelta() >= 0 ? StockMovementType.LOAD_TO_VEHICLE : StockMovementType.ADJUSTMENT)
                .product(product)
                .quantityDelta(r.getQuantityDelta())
                .fromType(r.getQuantityDelta() >= 0 ? StockLocationType.BRANCH_WAREHOUSE : StockLocationType.VEHICLE)
                .toType(r.getQuantityDelta() >= 0 ? StockLocationType.VEHICLE : StockLocationType.VEHICLE)
                .vehicle(vehicle)
                .createdBy(employeeId != null ? em.getReference(Employee.class, employeeId) : null)
                .unit(pvs.getUnit())
                .notes(r.getNotes())
                .build();
        productStockMovementRepository.save(move);

        return StockMapper.toVehicleStock(pvs);
    }

    @Transactional(readOnly = true)
    public List<VehicleQuickSearchResponse> quickSearch(String query, Boolean onlyActive) {
        String normalized = query == null ? "" : query.trim();
        boolean activeOnly = Boolean.TRUE.equals(onlyActive);
        List<Vehicle> vehicles;
        if (normalized.isEmpty()) {
            vehicles = activeOnly
                    ? vehicleRepository.findTop10ByActiveTrueOrderByNameAsc()
                    : vehicleRepository.findTop10ByOrderByNameAsc();
        } else {
            vehicles = activeOnly
                    ? vehicleRepository.findTop10ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(normalized)
                    : vehicleRepository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(normalized);
        }
        return vehicles.stream().map(VehicleMapper::toQuickSearch).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductStockMovementResponse> listMovements(Long vehicleId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("createdAt").descending());
        Page<ProductStockMovement> result = vehicleId != null ? productStockMovementRepository.findByVehicle_Id(vehicleId, pageable) : productStockMovementRepository.findAll(pageable);
        List<ProductStockMovementResponse> content = result.getContent().stream().map(StockMapper::toMovement).collect(Collectors.toList());
        return PaginatedResponse.<ProductStockMovementResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional
    public VehiclePingResponse createPing(CreateVehiclePingRequest r) {
        VehicleLocationPing ping = VehicleLocationPing.builder()
                .vehicle(em.getReference(Vehicle.class, r.getVehicleId()))
                .employee(r.getEmployeeId() != null ? em.getReference(Employee.class, r.getEmployeeId()) : null)
                .timestamp(r.getTimestamp())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .speedKmh(r.getSpeedKmh())
                .note(r.getNote())
                .build();
        pingRepository.save(ping);
        return VehiclePingResponse.builder()
                .id(ping.getId())
                .vehicleId(ping.getVehicle().getId())
                .timestamp(ping.getTimestamp())
                .latitude(ping.getLatitude())
                .longitude(ping.getLongitude())
                .speedKmh(ping.getSpeedKmh())
                .note(ping.getNote())
                .build();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<VehiclePingResponse> listPings(Long vehicleId, LocalDateTime from, LocalDateTime to, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("timestamp").descending());
        Page<VehicleLocationPing> result = pingRepository.findByVehicle_IdAndTimestampBetween(vehicleId, from, to, pageable);
        List<VehiclePingResponse> content = result.getContent().stream().map(p -> VehiclePingResponse.builder()
                .id(p.getId())
                .vehicleId(p.getVehicle().getId())
                .timestamp(p.getTimestamp())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .speedKmh(p.getSpeedKmh())
                .note(p.getNote())
                .build()).collect(Collectors.toList());
        return PaginatedResponse.<VehiclePingResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }
}
