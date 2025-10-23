package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitAttachmentResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String mimeType;
}
