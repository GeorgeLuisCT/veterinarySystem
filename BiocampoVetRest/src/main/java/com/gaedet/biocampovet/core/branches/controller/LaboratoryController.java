package com.gaedet.biocampovet.core.branches.controller;

import com.gaedet.biocampovet.core.branches.dto.LaboratoryResponse;
import com.gaedet.biocampovet.core.branches.service.LaboratoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/laboratories")
@RequiredArgsConstructor
@Validated
public class LaboratoryController {

    private final LaboratoryService laboratoryService;

    @GetMapping
    public ResponseEntity<List<LaboratoryResponse>> list(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(laboratoryService.list(branchId));
    }
}
