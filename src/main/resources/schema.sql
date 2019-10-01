CREATE TABLE IF NOT EXISTS ContentFiles (
    fileId INTEGER PRIMARY KEY AUTOINCREMENT,
    fileName TEXT UNIQUE,
    downloadedAt INT
);

CREATE TABLE IF NOT EXISTS InventoryItems (
    hashId INTEGER,
    fileId INTEGER,
    jsonMd5 TEXT,
    json TEXT,
    PRIMARY KEY (hashId, fileId),
    FOREIGN KEY (fileId) REFERENCES ContentFiles (fileId)
);

CREATE TABLE IF NOT EXISTS Lore (
    hashId INTEGER,
    fileId INTEGER,
    jsonMd5 TEXT,
    json TEXT,
    PRIMARY KEY (hashId, fileId),
    FOREIGN KEY (fileId) REFERENCES ContentFiles (fileId)
);