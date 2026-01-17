package com.gaedet.veterinarysystem.core.clinic.controller;


import java.util.List;

import com.gaedet.veterinarysystem.core.clinic.dto.MedicalRecordSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService service;

    @GetMapping("/summary")
    public List<MedicalRecordSummaryResponse> getSummary(
            @RequestParam Long animalId
    ) {
        return service.getLast20ByAnimal(animalId);
    }
}