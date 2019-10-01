package com.mromanak.bungieapireader.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.nio.file.Path;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExportResponse {
    private String fileName;
    private Path filePath;
    private Long fileId;
    private Boolean alreadyExported;
}
