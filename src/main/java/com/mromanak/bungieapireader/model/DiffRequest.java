package com.mromanak.bungieapireader.model;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.nio.file.Path;

@Data
public class DiffRequest {

    @NotNull
    private Path newDbPath;

    @NotNull
    private Path oldDbPath;

    @NotNull
    private Path diffDbPath;
}
