package com.gaedet.biocampovet.core.customer.mapper;


import com.gaedet.biocampovet.core.customer.dto.DocumentTypeResponse;
import com.gaedet.biocampovet.core.customer.entity.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class DocumentTypeMapper {

    public DocumentTypeResponse toResponse(DocumentType entity) {
        if (entity == null) {
            return null;
        }

        return DocumentTypeResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .abbreviation(entity.getAbbreviation())
                .build();
    }
}
