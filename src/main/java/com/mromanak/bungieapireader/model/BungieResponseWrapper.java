package com.mromanak.bungieapireader.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BungieResponseWrapper<T> {

    @JsonProperty("Response") private T response;
}
