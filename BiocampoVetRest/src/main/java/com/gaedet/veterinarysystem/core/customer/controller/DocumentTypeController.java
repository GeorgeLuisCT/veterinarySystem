package com.gaedet.veterinarysystem.core.customer.controller;

import com.gaedet.veterinarysystem.core.customer.dto.DocumentTypeResponse;
import com.gaedet.veterinarysystem.core.customer.service.DocumentTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/document-types")
@RequiredArgsConstructor
public class DocumentTypeController {

    private final DocumentTypeService documentTypeService;

    @GetMapping
    public ResponseEntity<List<DocumentTypeResponse>> getDocumentTypes() {
        return ResponseEntity.ok(documentTypeService.getAllActiveDocumentTypes());
    }
}