import {createObjectCsvStringifier} from 'csv-writer';
import {DestinyItemInventoryBlockRarity} from "../model/destinyManifestDefinitions";
import InventoryItem from "../model/inventoryItem";
import ItemExplorer from "../explorer/itemExplorer";
import {titleCase} from "title-case";
import WeaponRoll from "../model/weaponRoll";

interface Stringifier<T extends InventoryItem> {
    stringifyAll(items: Iterable<T>, includeHeader?: boolean): string
}

class CsvItemStringifier<T extends InventoryItem> implements Stringifier<T> {
    readonly csvStringifier
    readonly columnDefinitions: CsvItemStringifierColumnDefinition<T>[] = []

    constructor(
        itemExplorer: ItemExplorer,
        config: CsvItemStringifierConfig<T>
    ) {
        this.columnDefinitions = CsvItemStringifier.mapColumns(itemExplorer, config)
        this.csvStringifier = createObjectCsvStringifier({
            header: this.columnDefinitions,
            fieldDelimiter: config.fieldDelimiter
        })
    }

    private static mapColumns<T extends InventoryItem>(itemExplorer: ItemExplorer, config: CsvItemStringifierConfig<T>) {
        let columns: CsvItemStringifierColumnDefinition<T>[] = []
        for (let column of config.columns) {
            if (typeof column == 'string') {
                columns.push(this.mapStandardColumn(itemExplorer, column))
            } else {
                columns.push(column)
            }
        }
        return columns
    }

    private static mapStandardColumn<T extends InventoryItem>(itemExplorer: ItemExplorer, column: InventoryItemStandardColumnDefinition): CsvItemStringifierColumnDefinition<T> {
        switch (column) {
            case 'id':
                return {
                    id: column,
                    title: 'ID',
                    extractor: item => item.id
                }
            case 'name':
                return {
                    id: column,
                    title: 'name',
                    extractor: item => item.name
                }
            case 'description':
                return {
                    id: column,
                    title: 'Description',
                    extractor: item => item.description
                }
            case 'itemType':
                return {
                    id: column,
                    title: 'Item Type',
                    extractor: item => item.itemTypeDisplayName
                }
            case 'rarity':
                return {
                    id: column,
                    title: 'Rarity',
                    extractor: item => titleCase(DestinyItemInventoryBlockRarity[item.rarity].toLowerCase())
                }
            case 'baseImpact':
                return {
                    id: column,
                    title: 'Base Impact',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Impact')
                }
            case 'baseRange':
                return {
                    id: column,
                    title: 'Base Range',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Range')
                }
            case 'baseStability':
                return {
                    id: column,
                    title: 'Base Stability',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Stability')
                }
            case 'baseHandling':
                return {
                    id: column,
                    title: 'Base Handling',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Handling')
                }
            case 'baseReloadSpeed':
                return {
                    id: column,
                    title: 'Base Reload Speed',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Reload Speed')
                }
            case 'baseRpm':
                return {
                    id: column,
                    title: 'Base Rounds Per Minute',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Rounds Per Minute')
                }
            case 'baseMagazine':
                return {
                    id: column,
                    title: 'Base Magazine',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Magazine')
                }
            case 'baseAimAssistance':
                return {
                    id: column,
                    title: 'Base Aim Assistance',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Aim Assistance')
                }
            case 'baseReserves':
                return {
                    id: column,
                    title: 'Base Inventory Size',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Inventory Size')
                }
            case 'baseZoom':
                return {
                    id: column,
                    title: 'Base Zoom',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Zoom')
                }
            case 'baseRecoil':
                return {
                    id: column,
                    title: 'Base Recoil',
                    extractor: this.baseStatExtractorFor(itemExplorer, 'Recoil')
                }
            case 'damageType':
                return {
                    id: 'damageType',
                    title: 'Damage Type',
                    extractor: item => itemExplorer.idToDamageTypeMap[item.damageTypeId || 0]?.name
                }
        }
    }

    static baseStatExtractorFor<T extends InventoryItem>(itemExplorer: ItemExplorer, statName: string): (item: T) => CsvColumnType {
        let statId = itemExplorer.statIdsFor(statName)?.[0]
        return item => item?.statIdToBaseValueMap?.[statId]
    }

    stringifyAll(items: Iterable<T>, includeHeader: boolean = false): string {
        let header = ''
        if (includeHeader) {
            let headerString = this.csvStringifier.getHeaderString()
            if (headerString) {
                header += headerString
            }
        }

        let rowObjects: ({ [key: string]: CsvColumnType })[] = []
        for (let item of items) {
            let rowObject: { [key: string]: CsvColumnType } = {}
            for (let columnDefinition of this.columnDefinitions) {
                rowObject[columnDefinition.id] = columnDefinition.extractor(item)
            }
            rowObjects.push(rowObject)
        }

        return header + this.csvStringifier.stringifyRecords(rowObjects)
    }
}

type InventoryItemStandardColumnDefinition =
    'id'
    | 'name'
    | 'description'
    | 'itemType'
    | 'rarity'
    | 'baseImpact'
    | 'baseRange'
    | 'baseStability'
    | 'baseHandling'
    | 'baseReloadSpeed'
    | 'baseRpm'
    | 'baseMagazine'
    | 'baseAimAssistance'
    | 'baseReserves'
    | 'baseZoom'
    | 'baseRecoil'
    | 'damageType'

type CsvColumnType = number | string | undefined

interface CsvItemStringifierConfig<T extends InventoryItem> {
    columns: (InventoryItemStandardColumnDefinition | CsvItemStringifierColumnDefinition<T>)[]
    fieldDelimiter?: string
}

interface CsvItemStringifierColumnDefinition<T extends InventoryItem> {
    id: string
    title: string
    extractor: (item: T) => CsvColumnType
}

class CsvRollStringifier<T extends WeaponRoll> implements Stringifier<T> {

    readonly csvStringifier
    readonly columnDefinitions: CsvItemStringifierColumnDefinition<T>[] = []

    constructor(
        itemExplorer: ItemExplorer,
        config: CsvRollStringifierConfig<T>
    ) {
        this.columnDefinitions = CsvRollStringifier.mapColumns(itemExplorer, config)
        this.csvStringifier = createObjectCsvStringifier({
            header: this.columnDefinitions,
            fieldDelimiter: config.fieldDelimiter
        })
    }


    private static mapColumns<T extends WeaponRoll>(itemExplorer: ItemExplorer, config: CsvRollStringifierConfig<T>) {
        let columns: CsvItemStringifierColumnDefinition<T>[] = []
        for (let column of config.columns) {
            if (typeof column == 'string') {
                columns.push(this.mapStandardColumn(itemExplorer, column))
            } else {
                columns.push(column)
            }
        }
        return columns
    }

    private static mapStandardColumn<T extends WeaponRoll>(itemExplorer: ItemExplorer, column: WeaponRollStandardColumnDefinition): CsvItemStringifierColumnDefinition<T> {
        switch (column) {
            case 'id':
                return {
                    id: column,
                    title: 'ID',
                    extractor: item => item.id
                }
            case 'name':
                return {
                    id: column,
                    title: 'Name',
                    extractor: item => item.name
                }
            case 'description':
                return {
                    id: column,
                    title: 'Description',
                    extractor: item => item.description
                }
            case 'itemType':
                return {
                    id: column,
                    title: 'Item Type',
                    extractor: item => item.itemTypeDisplayName
                }
            case 'rarity':
                return {
                    id: column,
                    title: 'Rarity',
                    extractor: item => titleCase(DestinyItemInventoryBlockRarity[item.rarity].toLowerCase())
                }
            case 'baseImpact':
                return {
                    id: column,
                    title: 'Base Impact',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Impact')
                }
            case 'baseRange':
                return {
                    id: column,
                    title: 'Base Range',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Range')
                }
            case 'baseStability':
                return {
                    id: column,
                    title: 'Base Stability',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Stability')
                }
            case 'baseHandling':
                return {
                    id: column,
                    title: 'Base Handling',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Handling')
                }
            case 'baseReloadSpeed':
                return {
                    id: column,
                    title: 'Base Reload Speed',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Reload Speed')
                }
            case 'baseRpm':
                return {
                    id: column,
                    title: 'Base Rounds Per Minute',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Rounds Per Minute')
                }
            case 'baseMagazine':
                return {
                    id: column,
                    title: 'Base Magazine',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Magazine')
                }
            case 'baseAimAssistance':
                return {
                    id: column,
                    title: 'Base Aim Assistance',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Aim Assistance')
                }
            case 'baseReserves':
                return {
                    id: column,
                    title: 'Base Inventory Size',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Inventory Size')
                }
            case 'baseZoom':
                return {
                    id: column,
                    title: 'Base Zoom',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Zoom')
                }
            case 'baseRecoil':
                return {
                    id: column,
                    title: 'Base Recoil',
                    extractor: CsvItemStringifier.baseStatExtractorFor(itemExplorer, 'Recoil')
                }
            case 'damageType':
                return {
                    id: 'damageType',
                    title: 'Damage Type',
                    extractor: item => itemExplorer.idToDamageTypeMap[item.damageTypeId || 0]?.name
                }
            case 'displayImpact':
                return {
                    id: column,
                    title: 'Impact',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Impact')
                }
            case 'displayRange':
                return {
                    id: column,
                    title: 'Range',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Range')
                }
            case 'displayStability':
                return {
                    id: column,
                    title: 'Stability',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Stability')
                }
            case 'displayHandling':
                return {
                    id: column,
                    title: 'Handling',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Handling')
                }
            case 'displayReloadSpeed':
                return {
                    id: column,
                    title: 'Reload Speed',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Reload Speed')
                }
            case 'displayRpm':
                return {
                    id: column,
                    title: 'Rounds Per Minute',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Rounds Per Minute')
                }
            case 'displayMagazine':
                return {
                    id: column,
                    title: 'Magazine',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Magazine')
                }
            case 'displayAimAssistance':
                return {
                    id: column,
                    title: 'Aim Assistance',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Aim Assistance')
                }
            case 'displayReserves':
                return {
                    id: column,
                    title: 'Inventory Size',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Inventory Size')
                }
            case 'displayZoom':
                return {
                    id: column,
                    title: 'Zoom',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Zoom')
                }
            case 'displayRecoil':
                return {
                    id: column,
                    title: 'Recoil',
                    extractor: CsvRollStringifier.displayStatExtractorFor(itemExplorer, 'Recoil')
                }
            case 'rollType':
                return {
                    id: column,
                    title: 'Roll Type',
                    extractor: roll => roll.perkBlock.isRandomRoll ? 'Random' : 'Curated'
                }
            case 'perks':
                return {
                    id: column,
                    title: 'Perks',
                    extractor: roll => [...roll.perkBlock.perkNames].join('/')
                }
        }
    }

    static displayStatExtractorFor(itemExplorer: ItemExplorer, statName: string): (roll: WeaponRoll) => CsvColumnType {
        let statId = itemExplorer.statIdsFor(statName)?.[0]
        return roll => roll.getDisplayStatValue(statId)
    }

    stringifyAll(items: Iterable<T>, includeHeader: boolean = false): string {
        let header = ''
        if (includeHeader) {
            let headerString = this.csvStringifier.getHeaderString()
            if (headerString) {
                header += headerString
            }
        }

        let rowObjects: ({ [key: string]: CsvColumnType })[] = []
        for (let item of items) {
            let rowObject: { [key: string]: CsvColumnType } = {}
            for (let columnDefinition of this.columnDefinitions) {
                rowObject[columnDefinition.id] = columnDefinition.extractor(item)
            }
            rowObjects.push(rowObject)
        }

        return header + this.csvStringifier.stringifyRecords(rowObjects)
    }
}

type WeaponRollStandardColumnDefinition =
    InventoryItemStandardColumnDefinition
    | 'displayImpact'
    | 'displayRange'
    | 'displayStability'
    | 'displayHandling'
    | 'displayReloadSpeed'
    | 'displayRpm'
    | 'displayMagazine'
    | 'displayAimAssistance'
    | 'displayReserves'
    | 'displayZoom'
    | 'displayRecoil'
    | 'rollType'
    | 'perks'

interface CsvRollStringifierConfig<T extends WeaponRoll> {
    columns: (WeaponRollStandardColumnDefinition | CsvItemStringifierColumnDefinition<T>)[]
    fieldDelimiter?: string
}

export {
    CsvItemStringifier,
    CsvRollStringifier
}