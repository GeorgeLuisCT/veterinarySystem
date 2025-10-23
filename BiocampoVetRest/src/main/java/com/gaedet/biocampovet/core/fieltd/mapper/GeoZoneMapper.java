package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.CreateGeoZoneRequest;
import com.gaedet.biocampovet.core.fieltd.dto.GeoZoneResponse;
import com.gaedet.biocampovet.core.fieltd.dto.GeoZoneSummaryResponse;
import com.gaedet.biocampovet.core.fieltd.dto.UpdateGeoZoneRequest;
import com.gaedet.biocampovet.core.fieltd.entity.GeoZone;

public class GeoZoneMapper {

    public static GeoZoneSummaryResponse toSummary(GeoZone e) {
        return GeoZoneSummaryResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .type(e.getType())
                .parentId(e.getParent() == null ? null : e.getParent().getId())
                .parentName(e.getParent() == null ? null : e.getParent().getName())
                .active(e.isActive())
                .build();
    }

    public static GeoZoneResponse toResponse(GeoZone e) {
        return GeoZoneResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .type(e.getType())
                .parentId(e.getParent() == null ? null : e.getParent().getId())
                .parentName(e.getParent() == null ? null : e.getParent().getName())
                .gpsCoordinates(e.getGpsCoordinates())
                .active(e.isActive())
                .build();
    }

    public static void applyCreate(GeoZone target, CreateGeoZoneRequest r) {
        target.setName(r.getName().trim());
        target.setType(r.getType());
        target.setGpsCoordinates(trimToNull(r.getGpsCoordinates()));
        if (r.getActive() != null) {
            target.setActive(r.getActive());
        }
    }

    public static void applyUpdate(GeoZone target, UpdateGeoZoneRequest r) {
        target.setName(r.getName().trim());
        target.setType(r.getType());
        target.setGpsCoordinates(trimToNull(r.getGpsCoordinates()));
        if (r.getActive() != null) {
            target.setActive(r.getActive());
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}

