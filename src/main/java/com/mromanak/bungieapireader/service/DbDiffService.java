package com.mromanak.bungieapireader.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.diff.JsonDiff;
import lombok.Data;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ParameterizedPreparedStatementSetter;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.sqlite.JDBC;
import org.sqlite.SQLiteDataSource;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Service
public class DbDiffService {

    private final ObjectMapper objectMapper;

    public DbDiffService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void createInventoryItemDiffDb(Path newDbPath, Path oldDbPath, Path diffDbPath) {
        Objects.requireNonNull(newDbPath, "New DB path must be non-null");
        Objects.requireNonNull(oldDbPath, "Old DB path must be non-null");
        Objects.requireNonNull(diffDbPath, "Diff DB path must be non-null");
        if (Files.exists(diffDbPath)) {
            throw new IllegalArgumentException("A file already exists at the diff DB path");
        }

        Map<Long, String> newDbContent = readInventoryItemContent(newDbPath);
        Map<Long, String> oldDbContent = readInventoryItemContent(oldDbPath);
        List<DbDiffEntry> diffEntries = new ArrayList<>(newDbContent.size());

        for (Map.Entry<Long, String> newEntry : newDbContent.entrySet()) {
            Long id = newEntry.getKey();
            String newJson = newEntry.getValue();
            String oldJson = oldDbContent.remove(id);
            diffEntries.add(createDiffEntry(id, newJson, oldJson));
        }

        for (Map.Entry<Long, String> oldEntry : oldDbContent.entrySet()) {
            Long id = oldEntry.getKey();
            String oldJson = oldEntry.getValue();
            diffEntries.add(createDiffEntry(id, null, oldJson));
        }

        newDbContent.clear();
        oldDbContent.clear();
        initializeInventoryItemDiffDb(diffDbPath, diffEntries);
    }

    private Map<Long, String> readInventoryItemContent(Path dbPath) {
        String url = "jdbc:sqlite:" + dbPath.toAbsolutePath();
        DataSource dataSource = intializeDataSource(url);
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        int count = jdbcTemplate.queryForObject("SELECT count(*) FROM DestinyInventoryItemDefinition", Integer.class);
        Map<Long, String> inventoryItemContent = new HashMap<>(count);
        RowCallbackHandler rch = (ResultSet rs) -> {
            inventoryItemContent.put(rs.getLong("id"), rs.getString("json"));
        };
        jdbcTemplate.query("SELECT json_extract(json, '$.hash') AS id, json FROM DestinyInventoryItemDefinition", rch);
        return inventoryItemContent;
    }

    private void initializeInventoryItemDiffDb(Path dbPath, List<DbDiffEntry> diffEntries) {
        String url = "jdbc:sqlite:" + dbPath.toAbsolutePath();
        DataSource dataSource = intializeDataSource(url);
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        jdbcTemplate.execute("CREATE TABLE DestinyInventoryItemDiff (id BIGINT PRIMARY KEY, new_json TEXT, old_json TEXT, diff_json TEXT, added BOOLEAN, updated BOOLEAN, removed BOOLEAN, redacted BOOLEAN, revealed BOOLEAN)");

        ParameterizedPreparedStatementSetter<DbDiffEntry> ppss = (ps, diffEntry) -> {
            ps.setLong(1, diffEntry.getId());
            ps.setString(2, diffEntry.getNewJson());
            ps.setString(3, diffEntry.getOldJson());
            ps.setString(4, diffEntry.getDiffJson());
            ps.setBoolean(5, diffEntry.isAdded());
            ps.setBoolean(6, diffEntry.isUpdated());
            ps.setBoolean(7, diffEntry.isDeleted());
            ps.setBoolean(8, diffEntry.isRedacted());
            ps.setBoolean(9, diffEntry.isRevealed());
        };
        jdbcTemplate.batchUpdate("INSERT INTO DestinyInventoryItemDiff (id, new_json, old_json, diff_json, added, updated, removed, redacted, revealed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", diffEntries, diffEntries.size(), ppss);
    }

    private DataSource intializeDataSource(String url) {
        return DataSourceBuilder.create().
                url(url).
                driverClassName(JDBC.class.getCanonicalName()).
                type(SQLiteDataSource.class).
                build();
    }

    private DbDiffEntry createDiffEntry(Long id, String newJson, String oldJson) {
        DbDiffEntry diffEntry = new DbDiffEntry();
        diffEntry.setId(id);
        diffEntry.setNewJson(newJson);
        diffEntry.setOldJson(oldJson);

        if (oldJson == null) {
            diffEntry.setAdded(true);
            return diffEntry;
        } else if (newJson == null) {
            diffEntry.setDeleted(true);
            return diffEntry;
        }

        try {
            JsonNode newJsonNode = objectMapper.readTree(newJson);
            if (newJsonNode.get("redacted").asBoolean(false)) {
                diffEntry.setRedacted(true);
                diffEntry.setOldJson(null);
                return diffEntry;
            }

            JsonNode oldJsonNode = objectMapper.readTree(oldJson);
            if (oldJsonNode.get("redacted").asBoolean(false)) {
                diffEntry.setRevealed(true);
                return diffEntry;
            }

            JsonNode diff = JsonDiff.asJson(oldJsonNode, newJsonNode);
            if (diff.size() == 0) {
                diffEntry.setOldJson(null);
            } else {
                diffEntry.setUpdated(true);
                diffEntry.setDiffJson(objectMapper.writeValueAsString(diff));
            }
            return diffEntry;
        } catch (IOException e) {
            throw new UncheckedIOException(e.getMessage(), e);
        }
    }

    @Data
    private class DbDiffEntry {
        private Long id;
        private String newJson;
        private String oldJson;
        private String diffJson;
        private boolean isAdded = false;
        private boolean isUpdated = false;
        private boolean isDeleted = false;
        private boolean isRedacted = false;
        private boolean isRevealed = false;
    }
}
