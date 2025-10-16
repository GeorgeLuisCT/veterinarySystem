package com.gaedet.biocampovet.core.branches.controller;

import com.gaedet.biocampovet.core.branches.dto.OperatingRoomResponse;
import com.gaedet.biocampovet.core.branches.service.OperatingRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/operating-rooms")
@RequiredArgsConstructor
@Validated
public class OperatingRoomController {

    private final OperatingRoomService operatingRoomService;

    @GetMapping
    public ResponseEntity<List<OperatingRoomResponse>> list(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(operatingRoomService.list(branchId));
    }
}
