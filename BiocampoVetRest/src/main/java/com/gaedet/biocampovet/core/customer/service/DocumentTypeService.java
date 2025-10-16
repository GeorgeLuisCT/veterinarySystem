package com.gaedet.biocampovet.core.customer.service;

import com.gaedet.biocampovet.core.customer.dto.DocumentTypeResponse;
import com.gaedet.biocampovet.core.customer.entity.DocumentType;
import com.gaedet.biocampovet.core.customer.repository.DocumentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentTypeService {

    private final DocumentTypeRepository documentTypeRepository;

    public List<DocumentTypeResponse> getAllActiveDocumentTypes() {
        List<DocumentType> documentTypes = documentTypeRepository.findAll();
        return documentTypes.stream()
                .map(doc -> DocumentTypeResponse.builder()
                        .id(doc.getId())
                        .name(doc.getName())
                        .abbreviation(doc.getAbbreviation())
                        .build())
                .collect(Collectors.toList());
    }
}