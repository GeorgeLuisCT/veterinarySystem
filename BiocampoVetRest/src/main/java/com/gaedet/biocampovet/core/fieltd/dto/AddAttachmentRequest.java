package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddAttachmentRequest {
    @NotBlank
    private String fileName;
    @NotBlank
    private String fileUrl;
    private String mimeType;
}
