import _ from 'lodash'
import ItemExplorer from "./itemExplorer";
import InventoryItem from "../model/inventoryItem";
import {DestinyItemInventoryBlockRarity} from "../model/destinyManifestDefinitions";

abstract class AbstractWeaponChain<T extends InventoryItem> implements Iterable<T> {
    constructor(
        public itemExplorer: ItemExplorer,
        public chain: _.CollectionChain<T>
    ) {
    }

    values(): T[] {
        return this.chain.value()
    }

    [Symbol.iterator](): Iterator<T> {
        return this.values()[Symbol.iterator]();
    }

    // Base stat filters
    withStat(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithStatPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withAllStats(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithAllStatsPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withBaseStatLt(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.itemWithBaseStatLtPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withBaseStatLte(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.itemWithBaseStatLtePredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withBaseStatEq(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.itemWithBaseStatEqPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withBaseStatGte(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.itemWithBaseStatGtePredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withBaseStatGt(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.itemWithBaseStatGtPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    // Damage type filters
    withDamageType(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithDamageTypePredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withDamageTypeIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithDamageTypeInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    // Item category filters
    withItemCategory(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithItemCategoryPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutItemCategory(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithoutItemCategoryPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withItemCategoryIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithItemCategoryInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutItemCategoryIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithoutItemCategoryInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    // Power cap filters
    withPowerCapLt(value: number): this {
        let predicate = this.itemExplorer.itemWithPowerCapLtPredicate(value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withPowerCapLte(value: number): this {
        let predicate = this.itemExplorer.itemWithPowerCapLtePredicate(value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withPowerCapEq(value: number): this {
        let predicate = this.itemExplorer.itemWithPowerCapEqPredicate(value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withPowerCapGte(value: number): this {
        let predicate = this.itemExplorer.itemWithPowerCapGtePredicate(value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withPowerCapGt(value: number): this {
        let predicate = this.itemExplorer.itemWithPowerCapGtPredicate(value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    // Weapon property filters
    withId(id: number): this {
        this.chain = this.chain.filter((weapon) => id == weapon.id)
        return this
    }

    withIdIn(...ids: number[]): this {
        let idSet = new Set(ids)
        this.chain = this.chain.filter((weapon) => idSet.has(weapon.id))
        return this
    }

    excludingBetaItems(): this {
        let betaItemIdSet = new Set([311852248, 1648316470])
        this.chain = this.chain.filter((weapon) => !betaItemIdSet.has(weapon.id))
        return this
    }

    withName(name: string): this {
        this.chain = this.chain.filter((weapon) => name == weapon.name)
        return this
    }

    withNameIn(...names: string[]): this {
        let nameSet = new Set(names)
        this.chain = this.chain.filter((weapon) => nameSet.has(weapon.name))
        return this
    }

    withNameMatching(namePattern: RegExp): this {
        this.chain = this.chain.filter((weapon) => namePattern.test(weapon.name))
        return this
    }

    withRarityLt(rarity: DestinyItemInventoryBlockRarity): this {
        this.chain = this.chain.filter((weapon) => weapon.rarity.valueOf() < rarity.valueOf())
        return this
    }

    withRarityLte(rarity: DestinyItemInventoryBlockRarity): this {
        this.chain = this.chain.filter((weapon) => weapon.rarity.valueOf() <= rarity.valueOf())
        return this
    }

    withRarityEq(rarity: DestinyItemInventoryBlockRarity): this {
        this.chain = this.chain.filter((weapon) => weapon.rarity.valueOf() == rarity.valueOf())
        return this
    }

    withRarityGte(rarity: DestinyItemInventoryBlockRarity): this {
        this.chain = this.chain.filter((weapon) => weapon.rarity.valueOf() >= rarity.valueOf())
        return this
    }

    withRarityGt(rarity: DestinyItemInventoryBlockRarity): this {
        this.chain = this.chain.filter((weapon) => weapon.rarity.valueOf() > rarity.valueOf())
        return this
    }

    withItemTypeDisplayName(itemTypeDisplayName: string): this {
        this.chain = this.chain.filter((weapon) => itemTypeDisplayName == weapon.itemTypeDisplayName)
        return this
    }

    withItemTypeDisplayNameIn(...itemTypeDisplayNames: string[]): this {
        let nameSet = new Set(itemTypeDisplayNames)
        this.chain = this.chain.filter((weapon) => nameSet.has(weapon.itemTypeDisplayName))
        return this
    }

    withTrait(traitId: string): this {
        this.chain = this.chain.filter((weapon) => weapon.traitIds.has(traitId))
        return this
    }

    withoutTrait(traitId: string): this {
        this.chain = this.chain.filter((weapon) => weapon.traitIds.has(traitId))
        return this
    }

    withTraitIn(...traitIds: string[]): this {
        this.chain = this.chain.filter((weapon) => this.itemExplorer.setHasAny(weapon.traitIds, traitIds))
        return this
    }

    withoutTraitIn(...traitIds: string[]): this {
        this.chain = this.chain.filter((weapon) => !this.itemExplorer.setHasAny(weapon.traitIds, traitIds))
        return this
    }

    // Weapon perk filters
    withIntrinsicPerk(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithIntrinsicPerkPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutIntrinsicPerk(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemWithoutIntrinsicPerkPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withIntrinsicPerkIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithIntrinsicPerkInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutIntrinsicPerkIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemWithoutIntrinsicPerkInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    thatCanHavePerk(nameOrId: string | number): this {
        let predicate = this.itemExplorer.itemThatCanHavePerkPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    thatCanHavePerkIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.itemThatCanHavePerkInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    filter(predicate: (item: T) => boolean): this {
        this.chain = this.chain.filter(predicate)
        return this
    }

    limit(n: number): this {
        this.chain = this.chain.take(n)
        return this
    }

    sortedBy (sortFunctions: ((item: T) => number | string)[]|((item: T) => number | string), ...sortDirections: ("asc" | "desc")[]): this {
        this.chain = this.chain.orderBy(sortFunctions, sortDirections)
        return this
    }

    uniqueById(): this {
        this.chain = this.chain.uniqBy((item: T) => item.id)
        return this
    }

    uniqueBy(mapper: (item: T) => number | string): this {
        this.chain = this.chain.uniqBy(mapper)
        return this
    }
}

export default AbstractWeaponChain
