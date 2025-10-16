package com.gaedet.biocampovet.core.branches.controller;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.service.BranchService;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {
    private final BranchService branchService;
    private final JwtTokenProvider jwtTokenProvider;


    @GetMapping
    public ResponseEntity<List<BranchResponse>> getBranches(@RequestParam(required = false) String search) {
        List<BranchResponse> branches = branchService.getAllBranches(search);
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/by-employee")
    public ResponseEntity<List<BranchResponse>> getBranchesByLoggedEmployee() {
        Long employeeId = jwtTokenProvider.getEmployeeId();
        List<BranchResponse> branches = branchService.getBranchesByEmployeeId(employeeId);
        return ResponseEntity.ok(branches);
    }
}