import _ from 'lodash'
import {
    DestinyInventoryItemDefinition,
    DestinyInventoryItemType,
    DestinyItemInventoryBlockRarity,
    DestinyItemSocketBlockDefinition,
    DestinyItemSocketEntryDefinition,
} from "./destinyManifestDefinitions";
import {NamedDbEntry} from "./utilityInterfaces";

class InventoryItem implements NamedDbEntry {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public index: number,
        public itemTypeDisplayName: string,
        public flavorText: string,
        public itemTypeAndRarity: string,
        public rarity: DestinyItemInventoryBlockRarity,
        public isPlug: boolean,
        public itemCategoryIds: Set<number>,
        public itemType: DestinyInventoryItemType,
        public traitIds: Set<string>,
        public statGroupId?: number,
        public currentPowerCapId?: number,
        public socketBlock?: ItemSocketBlock,
        public statIdToBaseValueMap?: {[key: number]: number},
        public damageTypeId?: number
    ) {
    }

    static fromManifestDefinition(def: DestinyInventoryItemDefinition) {
        let statIdToBaseValueMap: {[key: number]: number} | undefined = undefined
        if (def.investmentStats) {
            statIdToBaseValueMap = {}
            for (let stat of def.investmentStats) {
                statIdToBaseValueMap[stat.statTypeHash] = stat.value
            }
        }

        let currentPowerCapId: number | undefined = undefined
        if (def.quality) {
            currentPowerCapId = def.quality.versions[def.quality.currentVersion].powerCapHash
        }

        return new InventoryItem(
            def.hash,
            def.displayProperties.name,
            def.displayProperties.description,
            def.index,
            def.itemTypeDisplayName,
            def.flavorText,
            def.itemTypeAndTierDisplayName,
            def.inventory.tierType,
            !def.plug,
            new Set(def.itemCategoryHashes),
            def.itemType,
            new Set(def.traitIds),
            def.stats ? def.stats.statGroupHash : undefined,
            currentPowerCapId,
            def.sockets ? ItemSocketBlock.fromManifestDefinition(def.sockets) : undefined,
            statIdToBaseValueMap,
            def.defaultDamageTypeHash
        )
    }
}

class ItemSocketBlock {
    constructor(
        public sockets: ItemSocketEntry[],
        public intrinsicSocketIds: Set<number>
    ) {
    }

    static fromManifestDefinition(def: DestinyItemSocketBlockDefinition) {
        let indexToCategoryMap: { [key: number]: number } = {}
        for (let categoryToIndexEntry of def.socketCategories) {
            for (let index of categoryToIndexEntry.socketIndexes) {
                indexToCategoryMap[index] = categoryToIndexEntry.socketCategoryHash
            }
        }

        let sockets: ItemSocketEntry[] = []
        for (const [index, socketEntry] of def.socketEntries.entries()) {
            let socketCategoryId = indexToCategoryMap[index]
            sockets.push(ItemSocketEntry.fromManifestDefinition(socketCategoryId, socketEntry))
        }

        let intrinsicSocketIds: Set<number> = new Set()
        for (let intrinsicSocketEntry of def.intrinsicSockets) {
            intrinsicSocketIds.add(intrinsicSocketEntry.plugItemHash)
        }

        return new ItemSocketBlock(
            sockets,
            intrinsicSocketIds
        )
    }
}

class ItemSocketEntry {
    public hasRandomRolls: boolean

    constructor(
        public socketCategoryId: number,
        public socketTypeId: number,
        public initialPlugId: number,
        public fixedPlugIds?: Set<number>,
        public fixedPlugSetId?: number,
        public randomizedPlugSetId?: number
    ) {
        this.hasRandomRolls = !!randomizedPlugSetId
    }

    static fromManifestDefinition(socketCategoryId: number, def: DestinyItemSocketEntryDefinition) {
        let reusablePlugItems: Set<number> | undefined = def.reusablePlugItems ?
            new Set(_.map(def.reusablePlugItems, (plugItem) => {
                return plugItem.plugItemHash
            })):
            undefined

        return new ItemSocketEntry(
            socketCategoryId,
            def.socketTypeHash,
            def.singleInitialItemHash,
            reusablePlugItems,
            def.reusablePlugSetHash,
            def.randomizedPlugSetHash
        )
    }
}

export default InventoryItem
export {
    ItemSocketBlock,
    ItemSocketEntry
}
