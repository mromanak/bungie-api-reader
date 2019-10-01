package com.mromanak.bungieapireader.service;

import com.mromanak.bungieapireader.model.BungieResponseWrapper;
import com.mromanak.bungieapireader.model.DestinyManifest;
import com.mromanak.bungieapireader.model.ExportResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.sqlite.JDBC;
import org.sqlite.SQLiteDataSource;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ContentService {

    @Value("${com.mromanak.scratchDirectory}")
    private String scratchDirectory;

    private final ConcurrentMap<Path, DataSourceAndTemplates> dataSourceMap = new ConcurrentHashMap<>();
    private final JdbcTemplate metadataJdbcTemplate;
    private final PublicApiService publicApiService;

    @Autowired
    public ContentService(JdbcTemplate metadataJdbcTemplate, PublicApiService publicApiService) {
        this.metadataJdbcTemplate = metadataJdbcTemplate;
        this.publicApiService = publicApiService;
    }

    public ExportResponse exportContent() throws IOException {
        String fileName = Optional.of(publicApiService.getManifest()).
            filter(r -> r.getStatusCode().is2xxSuccessful()).
            map(ResponseEntity::getBody).
            map(BungieResponseWrapper::getResponse).
            map(DestinyManifest::getMobileWorldContentPaths).
            map(m -> m.get("en")).
            orElseThrow(() -> new IllegalStateException("No EN World Content file defined in manifest"));

        ExportResponse exportResponse = download(fileName);
        if (exportResponse.getAlreadyExported()) {
            exportResponse.setInventoryItemRowsExported(countInventoryItemRows(exportResponse.getFileId()));
            exportResponse.setLoreRowsExported(countLoreRows(exportResponse.getFileId()));
        } else {
            exportResponse.setInventoryItemRowsExported(exportInventoryItemRows(exportResponse));
            exportResponse.setLoreRowsExported(exportLoreRows(exportResponse));
        }
        return exportResponse;
    }

    private ExportResponse download(String fileName) throws IOException {
        Path filePath = publicApiService.downloadWorldContent(fileName);

        try {
            String query = "SELECT fileId FROM ContentFiles WHERE fileName = ?;";
            return metadataJdbcTemplate
                .queryForObject(query, new Object[]{fileName}, exportRowMapper(fileName, filePath, true));
        } catch (IncorrectResultSizeDataAccessException e) {
            String update = "INSERT INTO ContentFiles (fileName, downloadedAt) VALUES (?,  strftime('%s','now'));";
            metadataJdbcTemplate.update(update, fileName);

            String query = "SELECT fileId FROM ContentFiles WHERE fileName = ?;";
            return metadataJdbcTemplate.queryForObject(query, new Object[]{fileName}, exportRowMapper(fileName, filePath, false));
        }
    }

    private RowMapper<ExportResponse> exportRowMapper(String fileName, Path filePath, Boolean alreadyExported) {
        return (ResultSet rs, int i) -> {
            ExportResponse exportResponse = new ExportResponse();
            exportResponse.setFileName(fileName);
            exportResponse.setFilePath(filePath);
            exportResponse.setFileId(rs.getLong("fileId"));
            exportResponse.setAlreadyExported(alreadyExported);
            return exportResponse;
        };
    }

    private Long exportInventoryItemRows(ExportResponse exportResponse) {
        JdbcTemplate contentFileJdbcTemplate = jdbcTemplateFor(exportResponse.getFilePath());
        String query = "SELECT json_extract(json ,'$.hash') AS hashId, json FROM DestinyInventoryItemDefinition;";
        String update = "INSERT INTO InventoryItems (hashId, fileId, jsonMd5, json) VALUES (?, ?, ?, ?);";
        RowCallbackHandler rch = exportRowCallbackHandler(exportResponse, update);
        contentFileJdbcTemplate.query(query, rch);
        return countInventoryItemRows(exportResponse.getFileId());
    }

    private Long exportLoreRows(ExportResponse exportResponse) {
        JdbcTemplate contentFileJdbcTemplate = jdbcTemplateFor(exportResponse.getFilePath());
        String query = "SELECT json_extract(json ,'$.hash') AS hashId, json FROM DestinyLoreDefinition;";
        String update = "INSERT INTO Lore (hashId, fileId, jsonMd5, json) VALUES (?, ?, ?, ?);";
        RowCallbackHandler rch = exportRowCallbackHandler(exportResponse, update);
        contentFileJdbcTemplate.query(query, rch);
        return countLoreRows(exportResponse.getFileId());
    }

    private RowCallbackHandler exportRowCallbackHandler(ExportResponse exportResponse, String update) {
        return (ResultSet rs) -> metadataJdbcTemplate.update(update, (PreparedStatement ps) -> {
            ps.setLong(1, rs.getLong("hashId"));
            ps.setLong(2, exportResponse.getFileId());
            String jsonString = rs.getString("json");
            ps.setString(3, DigestUtils.md5Hex(jsonString));
            ps.setString(4, jsonString);
        });
    }

    private Long countInventoryItemRows(Long fileId) {
        return metadataJdbcTemplate
            .queryForObject("SELECT count(*) FROM InventoryItems WHERE fileId = ?;", new Object[]{fileId}, Long.class);
    }

    private Long countLoreRows(Long fileId) {
        return metadataJdbcTemplate
            .queryForObject("SELECT count(*) FROM Lore WHERE fileId = ?;", new Object[]{fileId}, Long.class);
    }

    private DataSourceAndTemplates dataSourceAndTemplatesFor(Path path) {
        Objects.requireNonNull(path, "Path argument must be non-null");
        path = path.toAbsolutePath();

        String url = "jdbc:sqlite:" + path;
        DataSource dataSource = DataSourceBuilder.create().
            url(url).
            driverClassName(JDBC.class.getCanonicalName()).
            type(SQLiteDataSource.class).
            build();
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        NamedParameterJdbcTemplate namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
        return new DataSourceAndTemplates(dataSource, jdbcTemplate, namedParameterJdbcTemplate);
    }

    private JdbcTemplate jdbcTemplateFor(Path path) {
        return dataSourceMap.computeIfAbsent(path, this::dataSourceAndTemplatesFor).getJdbcTemplate();
    }

    @Data
    @AllArgsConstructor
    private class DataSourceAndTemplates {
        private final DataSource dataSource;
        private final JdbcTemplate jdbcTemplate;
        private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    }
}

