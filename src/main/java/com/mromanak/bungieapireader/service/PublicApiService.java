package com.mromanak.bungieapireader.service;

import com.mromanak.bungieapireader.model.BungieResponseWrapper;
import com.mromanak.bungieapireader.model.DestinyManifest;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static com.mromanak.bungieapireader.util.TypeUtils.bungieResponseFor;
import static java.nio.file.StandardOpenOption.CREATE_NEW;
import static org.springframework.http.HttpMethod.GET;

@Service
public class PublicApiService extends AbstractBungieApiService {

    private static final String MANIFEST_PATH = "/Platform/Destiny2/Manifest/";

    @Value("${com.mromanak.scratchDirectory}")
    private String scratchDirectory;

    private final RestTemplate restTemplate;

    public PublicApiService(RestTemplate genericRestTemplate) {
        this.restTemplate = genericRestTemplate;
    }

    public ResponseEntity<BungieResponseWrapper<DestinyManifest>> getManifest() {
        URI manifestUrl = uriFor(MANIFEST_PATH);
        ParameterizedTypeReference<BungieResponseWrapper<DestinyManifest>> responseType = bungieResponseFor(
            DestinyManifest.class);
        return restTemplate.exchange(manifestUrl, GET, emptyEntity(), responseType);
    }

    public Path downloadWorldContent(String fileName) throws IOException {
        Path outputDirectory = Paths.get(scratchDirectory);
        Path outputFile = outputDirectory.resolve(Paths.get(fileName).getFileName());
        if (Files.exists(outputFile)) {
            return outputFile;
        }

        URI contentUrl = uriFor(fileName);

        ResponseEntity<Resource> contentResource = restTemplate
            .exchange(contentUrl, GET, emptyEntity(), Resource.class);

        List<Path> outputPaths = new ArrayList<>();
        try (ZipInputStream zipInputStream = new ZipInputStream(contentResource.getBody().getInputStream())) {

            ZipEntry zipEntry;
            while ((zipEntry = zipInputStream.getNextEntry()) != null) {
                Path outputPath = outputDirectory.resolve(zipEntry.getName());
                writeToPath(zipInputStream, outputPath);
                outputPaths.add(outputPath);
            }
        }

        if (outputPaths.size() != 1) {
            throw new IllegalStateException(
                "Incorrect number of world content files downloaded from " + fileName + "; expected 1, but got " +
                    outputPaths.size() + ": " + outputPaths);
        }

        Path databaseFile = outputPaths.get(0);
        createCurrentSoftLink(databaseFile);
        return databaseFile;
    }

    private void createCurrentSoftLink(Path databaseFile) throws IOException {
        Path softLink = databaseFile.getParent().resolve("current");
        Files.deleteIfExists(softLink);
        Files.createSymbolicLink(softLink, databaseFile);
    }

    private void writeToPath(ZipInputStream zipInputStream, Path outputPath) throws IOException {
        try (OutputStream outputStream = Files.newOutputStream(outputPath, CREATE_NEW)) {
            IOUtils.copy(zipInputStream, outputStream);
        }
    }
}
