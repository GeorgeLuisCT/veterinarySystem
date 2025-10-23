package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateFieldRouteStopRequest {
    @NotNull
    private Long fieldVisitId;
    @NotNull
    private Integer position;
    private LocalTime eta;
}
