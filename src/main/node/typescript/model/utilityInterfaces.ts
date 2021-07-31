interface DbEntry {
    id: number,
    index: number
}

interface NamedDbEntry extends DbEntry {
    name: string
}

export {
    DbEntry,
    NamedDbEntry
}
