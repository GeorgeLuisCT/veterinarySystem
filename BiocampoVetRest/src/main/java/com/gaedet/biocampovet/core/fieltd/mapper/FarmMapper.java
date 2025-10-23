package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.CreateFarmRequest;
import com.gaedet.biocampovet.core.fieltd.dto.FarmQuickSearchResponse;
import com.gaedet.biocampovet.core.fieltd.dto.FarmResponse;
import com.gaedet.biocampovet.core.fieltd.dto.FarmSummaryResponse;
import com.gaedet.biocampovet.core.fieltd.dto.UpdateFarmRequest;
import com.gaedet.biocampovet.core.fieltd.entity.Farm;

public class FarmMapper {
    public static FarmSummaryResponse toSummary(Farm e) {
        return FarmSummaryResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .customerId(e.getCustomer() == null ? null : e.getCustomer().getId())
                .customerName(e.getCustomer() == null ? null : e.getCustomer().getName())
                .zoneId(e.getZone() == null ? null : e.getZone().getId())
                .zoneName(e.getZone() == null ? null : e.getZone().getName())
                .build();
    }

    public static FarmResponse toResponse(Farm e) {
        return FarmResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .customerId(e.getCustomer() == null ? null : e.getCustomer().getId())
                .customerName(e.getCustomer() == null ? null : e.getCustomer().getName())
                .zoneId(e.getZone() == null ? null : e.getZone().getId())
                .zoneName(e.getZone() == null ? null : e.getZone().getName())
                .locationDescription(trimToNull(e.getLocationDescription()))
                .gpsCoordinates(trimToNull(e.getGpsCoordinates()))
                .addressLabel(trimToNull(e.getAddressLabel()))
                .build();
    }

    public static void applyCreate(Farm target, CreateFarmRequest r) {
        target.setName(r.getName().trim());
        target.setLocationDescription(trimToNull(r.getLocationDescription()));
        target.setGpsCoordinates(trimToNull(r.getGpsCoordinates()));
        target.setAddressLabel(trimToNull(r.getAddressLabel()));
    }

    public static void applyUpdate(Farm target, UpdateFarmRequest r) {
        target.setName(r.getName().trim());
        target.setLocationDescription(trimToNull(r.getLocationDescription()));
        target.setGpsCoordinates(trimToNull(r.getGpsCoordinates()));
        target.setAddressLabel(trimToNull(r.getAddressLabel()));
    }

    public static FarmQuickSearchResponse toQuickSearch(Farm farm) {
        return FarmQuickSearchResponse.builder()
                .id(farm.getId())
                .name(farm.getName())
                .customerName(farm.getCustomer() != null ? farm.getCustomer().getName() : null)
                .zoneId(farm.getZone() != null ? farm.getZone().getId() : null)
                .zoneName(farm.getZone() != null ? farm.getZone().getName() : null)
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
