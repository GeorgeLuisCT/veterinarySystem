package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.entity.EvolutionNote;
import com.gaedet.veterinarysystem.core.clinic.dto.EvolutionNoteResponse;

public class EvolutionNoteMapper {
    public static EvolutionNoteResponse toResponse(EvolutionNote note) {
        EvolutionNoteResponse response = new EvolutionNoteResponse();
        response.setId(note.getId());
        response.setHospitalizationId(note.getHospitalization().getId());
        response.setTimestamp(note.getTimestamp());
        response.setNote(note.getNote());
        if (note.getAuthor() != null) {
            response.setAuthorId(note.getAuthor().getId());
            response.setAuthorFullName(note.getAuthor().getFirstName() + " " + note.getAuthor().getLastName());
        }
        return response;
    }
}
