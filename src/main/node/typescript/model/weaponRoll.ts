import _ from 'lodash'
import InventoryItem, {ItemSocketBlock} from "./inventoryItem";
import {DestinyInventoryItemType, DestinyItemInventoryBlockRarity} from "./destinyManifestDefinitions";
import StatGroup from "./statGroup";

class WeaponRoll extends InventoryItem {
    constructor(
        id: number,
        name: string,
        description: string,
        index: number,
        itemTypeDisplayName: string,
        flavorText: string,
        itemTypeAndRarity: string,
        rarity: DestinyItemInventoryBlockRarity,
        isPlug: boolean,
        itemCategoryIds: Set<number>,
        itemType: DestinyInventoryItemType,
        traitIds: Set<string>,
        public perkBlock: WeaponRollPerkBlock,
        public displayStatsBlock: DisplayStatBlock,
        statGroupId?: number,
        currentPowerCapId?: number,
        socketBlock?: ItemSocketBlock,
        statIdToBaseValueMap?: { [key: number]: number },
        damageTypeId?: number
    ) {
        super(
            id,
            name,
            description,
            index,
            itemTypeDisplayName,
            flavorText,
            itemTypeAndRarity,
            rarity,
            isPlug,
            itemCategoryIds,
            itemType,
            traitIds,
            statGroupId,
            currentPowerCapId,
            socketBlock,
            statIdToBaseValueMap,
            damageTypeId
        );
    }

    static fromInventoryItem(base: InventoryItem, perkBlock: WeaponRollPerkBlock, displayStatBlock: DisplayStatBlock): WeaponRoll {
        return new WeaponRoll(
            base.id,
            base.name,
            base.description,
            base.index,
            base.itemTypeDisplayName,
            base.flavorText,
            base.itemTypeAndRarity,
            base.rarity,
            base.isPlug,
            base.itemCategoryIds,
            base.itemType,
            base.traitIds,
            perkBlock,
            displayStatBlock,
            base.statGroupId,
            base.currentPowerCapId,
            base.socketBlock,
            base.statIdToBaseValueMap,
            base.damageTypeId,
        )
    }

    hasPerk(perkId: number): boolean {
        return this.perkBlock.hasPerk(perkId)
    }

    hasPerkIn(perkIds: Iterable<number>): boolean {
        return this.perkBlock.hasAnyPerk(perkIds)
    }

    hasAllPerks(perkIds: Iterable<number>): boolean {
        return this.perkBlock.hasAllPerks(perkIds)
    }

    getDisplayStatValue(statId: number): number {
        const baseValue = this?.statIdToBaseValueMap?.[statId] || 0
        return this.displayStatsBlock.interpolate(statId, baseValue)
    }

    statContributorsFor(statIds: Iterable<number>): Set<string> {
        return this.displayStatsBlock.statContributorsFor(...statIds);
    }
}

class WeaponRollPerkBlock {

    constructor(
        public isRandomRoll: boolean,
        public perkIds: Set<number>,
        public perkNames: Set<string>
    ) {
    }

    hasPerk(perkId: number): boolean {
        return this.perkIds.has(perkId)
    }

    hasAnyPerk(perkIds: Iterable<number>): boolean {
        return _.some(perkIds, (perkId: number) => this.perkIds.has(perkId))
    }

    hasAllPerks(perkIds: Iterable<number>): boolean {
        return _.every(perkIds, (perkId: number) => this.perkIds.has(perkId))
    }
}

class DisplayStatBlock {
    constructor(
        public statGroup: StatGroup,
        public statIdToModifierMaps: { [statId: number]: DisplayStatModifier[] } = {}
    ) {
    }

    interpolate(statId: number, baseValue: number): number {
        let value = baseValue
        if (this.statIdToModifierMaps[statId]) {
            for (let modifier of this.statIdToModifierMaps[statId]) {
                value += modifier.value || 0
            }
        }

        return this.statGroup.interpolate(statId, value)
    }

    statContributorsFor(...statIds: number[]): Set<string> {
        const contributors: Set<string> = new Set()
        for (let statId of statIds) {
            if (this.statIdToModifierMaps[statId]) {
                for (let modifier of this.statIdToModifierMaps[statId]) {
                    contributors.add(modifier.source)
                }
            }
        }
        return contributors
    }

    addStatsFrom(perk: InventoryItem): void {
        if (perk.statIdToBaseValueMap) {
            for (const [statId, statValue] of Object.entries(perk.statIdToBaseValueMap)) {
                let statIdNumber = Number(statId)
                if (this.statIdToModifierMaps[statIdNumber]) {
                    this.statIdToModifierMaps[statIdNumber].push(new DisplayStatModifier(
                        perk.name,
                        statValue
                    ))
                } else {
                    this.statIdToModifierMaps[statIdNumber] = [
                        new DisplayStatModifier(
                            perk.name,
                            statValue
                        )
                    ]
                }
            }
        }
    }
}

class DisplayStatModifier {
    constructor(
        public source: string,
        public value: number
    ) {
    }
}

export default WeaponRoll
export {
    DisplayStatBlock,
    DisplayStatModifier,
    WeaponRollPerkBlock
}
