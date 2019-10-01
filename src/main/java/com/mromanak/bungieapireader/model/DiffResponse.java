package com.mromanak.bungieapireader.model;

import lombok.Data;

import java.nio.file.Path;

@Data
public class DiffResponse {
    private Path diffDbPath;
}
