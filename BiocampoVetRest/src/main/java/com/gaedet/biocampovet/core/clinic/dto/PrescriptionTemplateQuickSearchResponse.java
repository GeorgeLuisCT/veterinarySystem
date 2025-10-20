package com.gaedet.biocampovet.core.clinic.dto;

public record PrescriptionTemplateQuickSearchResponse(
        Long id,
        String name,
        String purpose,
        String notesSnippet,
        Integer medicationsCount
) {
    public static PrescriptionTemplateQuickSearchResponse fromNativeRow(Object[] row) {
        return new PrescriptionTemplateQuickSearchResponse(
                ((Number) row[0]).longValue(),      // id
                (String) row[1],                    // name
                (String) row[2],                    // purpose
                (String) row[3],                    // notes_snippet
                ((Number) row[4]).intValue()        // medications_count
        );
    }
}

