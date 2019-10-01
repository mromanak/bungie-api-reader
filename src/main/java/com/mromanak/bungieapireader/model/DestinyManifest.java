package com.mromanak.bungieapireader.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DestinyManifest {

    private String version;
    private List<GearAssetDatabaseDefinition> mobileGearAssetDataBases;
    private Map<String, String> mobileWorldContentPaths;
}
