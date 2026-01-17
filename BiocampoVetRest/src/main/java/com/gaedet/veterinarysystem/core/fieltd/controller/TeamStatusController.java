package com.gaedet.veterinarysystem.core.fieltd.controller;

import com.gaedet.veterinarysystem.core.fieltd.dto.SetTeamStatusRequest;
import com.gaedet.veterinarysystem.core.fieltd.dto.TeamStatusResponse;
import com.gaedet.veterinarysystem.core.fieltd.service.TeamStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/fieldwork/team-status")
@RequiredArgsConstructor
@Validated
public class TeamStatusController {
    private final TeamStatusService teamStatusService;

    @GetMapping
    public ResponseEntity<List<TeamStatusResponse>> list() { return ResponseEntity.ok(teamStatusService.listAll()); }

    @PutMapping
    public ResponseEntity<TeamStatusResponse> setStatus(@Valid @RequestBody SetTeamStatusRequest r) { return ResponseEntity.ok(teamStatusService.setStatus(r)); }
}

