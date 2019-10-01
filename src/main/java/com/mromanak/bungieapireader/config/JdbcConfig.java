package com.mromanak.bungieapireader.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class JdbcConfig {

    @Value("${db.metadata.url}")
    private String url;
    @Value("${db.metadata.driver-class-name}")
    private String driverClassName;
    @Value("${db.metadata.type}")
    private Class<? extends DataSource> type;

    @Bean("metadataDataSource")
    public DataSource metadataDataSource() {
        return DataSourceBuilder.create().
            url(url).
            driverClassName(driverClassName).
            type(type).
            build();
    }

    @Bean("metadataJdbcTemplate")
    public JdbcTemplate metadataJdbcTemplate(@Qualifier("metadataDataSource") DataSource metdataDataSource) {
        return new JdbcTemplate(metdataDataSource);
    }
}
