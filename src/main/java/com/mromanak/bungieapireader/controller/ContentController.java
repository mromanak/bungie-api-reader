package com.mromanak.bungieapireader.controller;

import com.mromanak.bungieapireader.model.DiffRequest;
import com.mromanak.bungieapireader.model.DiffResponse;
import com.mromanak.bungieapireader.model.ExportResponse;
import com.mromanak.bungieapireader.service.ContentService;
import com.mromanak.bungieapireader.service.DbDiffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.validation.Valid;
import java.io.IOException;

@Controller
@RequestMapping("/content")
public class ContentController {

    private final ContentService contentService;
    private final DbDiffService diffService;

    @Autowired
    public ContentController(ContentService contentService, DbDiffService diffService) {
        this.contentService = contentService;
        this.diffService = diffService;
    }

    @RequestMapping("/export")
    public ResponseEntity<ExportResponse> export() throws IOException {
        return ResponseEntity.ok(contentService.exportContent());
    }

    @PostMapping("/diff/inventoryItem")
    public ResponseEntity<DiffResponse> diff(@Valid @RequestBody DiffRequest diffRequest) throws IOException {

        diffService.createInventoryItemDiffDb(diffRequest.getNewDbPath(), diffRequest.getOldDbPath(), diffRequest.getDiffDbPath());
        DiffResponse response = new DiffResponse();
        response.setDiffDbPath(diffRequest.getDiffDbPath());
        return ResponseEntity.ok(response);
    }
}
