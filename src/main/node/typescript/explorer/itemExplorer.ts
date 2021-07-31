import _ from 'lodash'
import knex from 'knex'
import DamageType from "../model/damageType";
import InventoryItem, {ItemSocketEntry} from "../model/inventoryItem";
import ItemCategory from "../model/itemCategory";
import PlugSet from "../model/plugSet";
import SocketCategory from "../model/socketCategory";
import SocketType from "../model/socketType";
import StatGroup from "../model/statGroup";
import Stat from "../model/stat";
import {DbEntry, NamedDbEntry} from "../model/utilityInterfaces";
import {
    DestinyInventoryItemType,
    DestinyManifestDefinition,
    DestinyNamedManifestDefinition
} from "../model/destinyManifestDefinitions";
import PowerCap from "../model/powerCap";
import WeaponRoll, {DisplayStatBlock, WeaponRollPerkBlock} from "../model/weaponRoll";

class ItemExplorer {

    private knex: knex;
    public idToDamageTypeMap: { [key: number]: DamageType } = {}
    public nameToDamageTypIdMultiMap: { [key: string]: number[] } = {}
    public idToWeaponMap: { [key: number]: InventoryItem } = {}
    public idToWeaponPerkMap: { [key: number]: InventoryItem } = {}
    public nameToWeaponPerkIdMultiMap: { [key: string]: number[] } = {}
    public idToItemCategoryMap: { [key: number]: ItemCategory } = {}
    public nameToItemCategoryIdMultiMap: { [key: string]: number[] } = {}
    public idToPlugSetMap: { [key: number]: PlugSet } = {}
    public idToPowerCapMap: { [key: number]: PowerCap } = {}
    public idToSocketCategoryMap: { [key: number]: SocketCategory } = {}
    public nameToSocketCategoryIdMultiMap: { [key: string]: number[] } = {}
    public weaponPerkSocketCategories: Set<number> = new Set()
    public idToSocketTypeMap: { [key: number]: SocketType } = {}
    public nonWeaponPerkSocketTypeIds: Set<number> = new Set()
    public intrinsicPerkSocketTypeIds: Set<number> = new Set()
    public idToStatMap: { [key: number]: Stat } = {}
    public nameToStatIdMultiMap: { [key: string]: number[] } = {}
    public idToStatGroupMap: { [key: number]: StatGroup } = {}

    constructor(
        filePath: string
    ) {
        this.knex = knex({
            client: 'sqlite3',
            useNullAsDefault: true,
            connection: {
                filename: filePath
            }
        })
    }

    async init() {
        let damageTypeMaps = await this.loadIdAndNameMaps(
            DamageType.fromManifestDefinition,
            'SELECT * FROM DestinyDamageTypeDefinition'
        )
        this.idToDamageTypeMap = damageTypeMaps.idMap
        this.nameToDamageTypIdMultiMap = damageTypeMaps.nameMultiMap

        this.idToWeaponMap = await this.loadIdMap(
            InventoryItem.fromManifestDefinition,
            'SELECT * FROM DestinyInventoryItemDefinition WHERE json_extract(json, \'$.itemType\') = ?',
            DestinyInventoryItemType.WEAPON.valueOf())

        let weaponPerkMaps = await this.loadIdAndNameMaps(
            InventoryItem.fromManifestDefinition,
            `SELECT *
             FROM DestinyInventoryItemDefinition
                      JOIN json_each(DestinyInventoryItemDefinition.json, '$.itemCategoryHashes') category
             WHERE value IN (
                 SELECT json_extract(json, '$.hash')
                 FROM DestinyItemCategoryDefinition
                 WHERE json_extract(json, '$.displayProperties.name') = 'Weapon Mods'
             )`
        )
        this.idToWeaponPerkMap = weaponPerkMaps.idMap
        this.nameToWeaponPerkIdMultiMap = weaponPerkMaps.nameMultiMap

        let itemCategoryMaps = await this.loadIdAndNameMaps(
            ItemCategory.fromManifestDefinition,
            'SELECT * FROM DestinyDamageTypeDefinition'
        )
        this.idToItemCategoryMap = itemCategoryMaps.idMap
        this.nameToItemCategoryIdMultiMap = itemCategoryMaps.nameMultiMap

        this.idToPlugSetMap = await this.loadIdMap(
            PlugSet.fromManifestDefinition,
            'SELECT * FROM DestinyPlugSetDefinition'
        )

        this.idToPowerCapMap = await this.loadIdMap(
            PowerCap.fromManifestDefinition,
            'SELECT * FROM DestinyPowerCapDefinition'
        )

        let socketCategoryMaps = await this.loadIdAndNameMaps(
            SocketCategory.fromManifestDefinition,
            'SELECT * FROM DestinySocketCategoryDefinition'
        )
        this.idToSocketCategoryMap = socketCategoryMaps.idMap
        this.nameToSocketCategoryIdMultiMap = socketCategoryMaps.nameMultiMap
        this.weaponPerkSocketCategories = new Set(this.nameToSocketCategoryIdMultiMap['WEAPON PERKS'])

        this.idToSocketTypeMap = await this.loadIdMap(
            SocketType.fromManifestDefinition,
            'SELECT * FROM DestinySocketTypeDefinition'
        )
        let nonWeaponPerkSocketTypeRegex = /^.*(trackers|shader).*$/
        this.nonWeaponPerkSocketTypeIds = new Set(
            _.chain(_.values(this.idToSocketTypeMap)).filter((socketType) => {
                return _.some([...socketType.allowableCategories], (category: string) => {
                    return nonWeaponPerkSocketTypeRegex.test(category)
                })
            }).map((socketType) => socketType.id).value()
        )
        this.intrinsicPerkSocketTypeIds = new Set(
            _.chain(_.values(this.idToSocketTypeMap)).filter((socketType) => {
                return socketType.allowableCategories.has('intrinsics')
            }).map((socketType) => socketType.id).value()
        )

        let statMaps = await this.loadIdAndNameMaps(
            Stat.fromManifestDefinition,
            'SELECT * FROM DestinyStatDefinition'
        )
        this.idToStatMap = statMaps.idMap
        this.nameToStatIdMultiMap = statMaps.nameMultiMap

        this.idToStatGroupMap = await this.loadIdMap(
            StatGroup.fromManifestDefinition,
            'SELECT * FROM DestinyStatGroupDefinition'
        )
    }

    async destroy() {
        return this.knex.destroy()
    }

    async loadIdMap<I extends DestinyManifestDefinition, O extends DbEntry>(mapper: (json: I) => O, query: string, ...queryBindings: knex.RawBinding[]) {
        let idMap: { [key: number]: O } = {}
        let results = await this.knex.raw(query, ...queryBindings)
        for (let result of results) {
            let def: I = JSON.parse(result.json)
            let obj: O = mapper(def)
            idMap[obj.id] = obj
        }
        return idMap
    }

    async loadIdAndNameMaps<I extends DestinyNamedManifestDefinition, O extends NamedDbEntry>(mapper: (json: I) => O, query: string, ...queryBindings: knex.RawBinding[]) {
        let idMap: { [key: number]: O } = {}
        let nameMultiMap: { [key: string]: number[] } = {}
        let results = await this.knex.raw(query, ...queryBindings)
        for (let result of results) {
            let def: I = JSON.parse(result.json)
            let obj: O = mapper(def)
            idMap[obj.id] = obj
            if (nameMultiMap[obj.name]) {
                nameMultiMap[obj.name].push(obj.id)
            } else {
                nameMultiMap[obj.name] = [obj.id]
            }
        }
        return {
            idMap,
            nameMultiMap
        }
    }

    // Utility methods
    idsFor<T extends NamedDbEntry>(idMap: { [id: number]: T }, nameMultiMap: { [name: string]: number[] }, nameOrId: string | number): number[] {
        let ids: number[] = []
        if (typeof nameOrId == 'string' && nameMultiMap[nameOrId]) {
            ids.push(...nameMultiMap[nameOrId])
        } else if (typeof nameOrId == 'number' && idMap[nameOrId]) {
            ids.push(idMap[nameOrId].id)
        }
        return ids
    }

    idsForAny<T extends NamedDbEntry>(idMap: { [id: number]: T }, nameMultiMap: { [name: string]: number[] }, ...namesOrIds: (string | number)[]): number[] {
        let ids: number[] = []
        for (let nameOrId of namesOrIds) {
            ids.push(...this.idsFor(idMap, nameMultiMap, nameOrId))
        }
        return ids
    }

    damageTypeIdsFor(nameOrId: string | number): number[] {
        return this.idsFor(this.idToDamageTypeMap, this.nameToDamageTypIdMultiMap, nameOrId)
    }

    damageTypeIdsForAny(...namesOrIds: (string | number)[]): number[] {
        return this.idsForAny(this.idToDamageTypeMap, this.nameToDamageTypIdMultiMap, ...namesOrIds)
    }

    itemCategoryIdsFor(nameOrId: string | number): number[] {
        return this.idsFor(this.idToItemCategoryMap, this.nameToDamageTypIdMultiMap, nameOrId)
    }

    itemCategoryIdsForAny(...namesOrIds: (string | number)[]): number[] {
        return this.idsForAny(this.idToItemCategoryMap, this.nameToDamageTypIdMultiMap, ...namesOrIds)
    }

    socketCategoryIdsFor(nameOrId: string | number): number[] {
        return this.idsFor(this.idToSocketCategoryMap, this.nameToDamageTypIdMultiMap, nameOrId)
    }

    socketCategoryIdsForAny(...namesOrIds: (string | number)[]): number[] {
        return this.idsForAny(this.idToSocketCategoryMap, this.nameToDamageTypIdMultiMap, ...namesOrIds)
    }

    statIdsFor(nameOrId: string | number): number[] {
        return this.idsFor(this.idToStatMap, this.nameToStatIdMultiMap, nameOrId)
    }

    statIdsForAny(...namesOrIds: (string | number)[]): number[] {
        return this.idsForAny(this.idToStatMap, this.nameToStatIdMultiMap, ...namesOrIds)
    }

    weaponPerkIdsFor(nameOrId: string | number): number[] {
        return this.idsFor(this.idToWeaponPerkMap, this.nameToWeaponPerkIdMultiMap, nameOrId)
    }

    weaponPerkIdsForAny(...namesOrIds: (string | number)[]): number[] {
        return this.idsForAny(this.idToWeaponPerkMap, this.nameToWeaponPerkIdMultiMap, ...namesOrIds)
    }

    setHasAny<T>(set: Set<T>, values: Iterable<T>): boolean {
        return _.some(values, (value: T) => set.has(value))
    }

    // Base stat predicates
    itemWithStatPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let statIds = new Set(_.map(this.statIdsFor(nameOrId), (statId) => String(statId)))
        return (item: InventoryItem) => this.setHasAny(statIds, _.keys(item.statIdToBaseValueMap))
    }

    itemWithAllStatsPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let statIdGroups = _.map(namesOrIds, (nameOrId) => {
            return new Set(_.map(this.statIdsFor(nameOrId), (statId) => String(statId)))
        })
        return (item: InventoryItem) => _.every(statIdGroups, (statIds) => {
            return this.setHasAny(statIds, _.keys(item.statIdToBaseValueMap))
        })
    }

    itemWithBaseStatLtPredicate(nameOrId: string | number, value: number): (item: InventoryItem) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (item: InventoryItem) => {
            return _.some(statIds, (statId: number) => {
                return !!item.statIdToBaseValueMap &&
                    !!item.statIdToBaseValueMap[statId] &&
                    (item.statIdToBaseValueMap[statId] < value)
            })
        }
    }

    itemWithBaseStatLtePredicate(nameOrId: string | number, value: number): (item: InventoryItem) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (item: InventoryItem) => {
            return _.some(statIds, (statId: number) => {
                return !!item.statIdToBaseValueMap &&
                    !!item.statIdToBaseValueMap[statId] &&
                    (item.statIdToBaseValueMap[statId] <= value)
            })
        }
    }

    itemWithBaseStatEqPredicate(nameOrId: string | number, value: number): (item: InventoryItem) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (item: InventoryItem) => {
            return _.some(statIds, (statId: number) => {
                return !!item.statIdToBaseValueMap &&
                    !!item.statIdToBaseValueMap[statId] &&
                    (item.statIdToBaseValueMap[statId] == value)
            })
        }
    }

    itemWithBaseStatGtePredicate(nameOrId: string | number, value: number): (item: InventoryItem) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (item: InventoryItem) => {
            return _.some(statIds, (statId: number) => {
                return !!item.statIdToBaseValueMap &&
                    !!item.statIdToBaseValueMap[statId] &&
                    (item.statIdToBaseValueMap[statId] >= value)
            })
        }
    }

    itemWithBaseStatGtPredicate(nameOrId: string | number, value: number): (item: InventoryItem) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (item: InventoryItem) => {
            return _.some(statIds, (statId: number) => {
                return !!item.statIdToBaseValueMap &&
                    !!item.statIdToBaseValueMap[statId] &&
                    (item.statIdToBaseValueMap[statId] > value)
            })
        }
    }

    // Damage type predicates
    itemWithDamageTypePredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let damageTypeIds = new Set(this.damageTypeIdsFor(nameOrId))
        return (item: InventoryItem) => !!item.damageTypeId && damageTypeIds.has(item.damageTypeId)
    }

    itemWithDamageTypeInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let damageTypeIds = new Set(this.damageTypeIdsForAny(...namesOrIds))
        return (item: InventoryItem) => !!item.damageTypeId && damageTypeIds.has(item.damageTypeId)
    }

    // Display stat predicates
    weaponRollWithDisplayStatLtPredicate(nameOrId: string | number, value: number): (weaponRoll: WeaponRoll) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (weaponRoll: WeaponRoll) => {
            return _.some(statIds, (statId: number) => {
                return weaponRoll.statIdToBaseValueMap?.[statId] != undefined &&
                    weaponRoll.getDisplayStatValue(statId) < value
            })
        }
    }

    weaponRollWithDisplayStatLtePredicate(nameOrId: string | number, value: number): (weaponRoll: WeaponRoll) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (weaponRoll: WeaponRoll) => {
            return _.some(statIds, (statId: number) => {
                return weaponRoll.statIdToBaseValueMap?.[statId] != undefined &&
                    weaponRoll.getDisplayStatValue(statId) <= value
            })
        }
    }

    weaponRollWithDisplayStatEqPredicate(nameOrId: string | number, value: number): (weaponRoll: WeaponRoll) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (weaponRoll: WeaponRoll) => {
            return _.some(statIds, (statId: number) => {
                return weaponRoll.statIdToBaseValueMap?.[statId] != undefined &&
                    weaponRoll.getDisplayStatValue(statId) == value
            })
        }
    }

    weaponRollWithDisplayStatGtePredicate(nameOrId: string | number, value: number): (weaponRoll: WeaponRoll) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (weaponRoll: WeaponRoll) => {
            return _.some(statIds, (statId: number) => {
                return weaponRoll.statIdToBaseValueMap?.[statId] != undefined &&
                    weaponRoll.getDisplayStatValue(statId) >= value
            })
        }
    }

    weaponRollWithDisplayStatGtPredicate(nameOrId: string | number, value: number): (weaponRoll: WeaponRoll) => boolean {
        let statIds = this.statIdsFor(nameOrId)
        return (weaponRoll: WeaponRoll) => {
            return _.some(statIds, (statId: number) => {
                return weaponRoll.statIdToBaseValueMap?.[statId] != undefined &&
                    weaponRoll.getDisplayStatValue(statId) > value
            })
        }
    }

    // Item category predicates
    itemWithItemCategoryPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let itemCategoryIds = new Set(this.itemCategoryIdsFor(nameOrId))
        return (item: InventoryItem) => this.setHasAny(itemCategoryIds, item.itemCategoryIds)
    }

    itemWithItemCategoryInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let itemCategoryIds = new Set(this.itemCategoryIdsForAny(...namesOrIds))
        return (item: InventoryItem) => this.setHasAny(itemCategoryIds, item.itemCategoryIds)
    }

    itemWithoutItemCategoryPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let itemCategoryIds = new Set(this.itemCategoryIdsFor(nameOrId))
        return (item: InventoryItem) => !this.setHasAny(itemCategoryIds, item.itemCategoryIds)
    }

    itemWithoutItemCategoryInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let itemCategoryIds = new Set(this.itemCategoryIdsForAny(...namesOrIds))
        return (item: InventoryItem) => !this.setHasAny(itemCategoryIds, item.itemCategoryIds)
    }

    // Power cap predicates
    itemWithPowerCapLtPredicate(value: number): (item: InventoryItem) => boolean {
        return (item: InventoryItem) => {
            return !!item.currentPowerCapId && (this.idToPowerCapMap[item.currentPowerCapId].value < value)
        }
    }

    itemWithPowerCapLtePredicate(value: number): (item: InventoryItem) => boolean {
        return (item: InventoryItem) => {
            return !!item.currentPowerCapId && (this.idToPowerCapMap[item.currentPowerCapId].value <= value)
        }
    }

    itemWithPowerCapEqPredicate(value: number): (item: InventoryItem) => boolean {
        return (item: InventoryItem) => {
            return !!item.currentPowerCapId && (this.idToPowerCapMap[item.currentPowerCapId].value == value)
        }
    }

    itemWithPowerCapGtePredicate(value: number): (item: InventoryItem) => boolean {
        return (item: InventoryItem) => {
            return !!item.currentPowerCapId && (this.idToPowerCapMap[item.currentPowerCapId].value >= value)
        }
    }

    itemWithPowerCapGtPredicate(value: number): (item: InventoryItem) => boolean {
        return (item: InventoryItem) => {
            return !!item.currentPowerCapId && (this.idToPowerCapMap[item.currentPowerCapId].value > value)
        }
    }

    // Weapon perk predicates
    itemWithIntrinsicPerkPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsFor(nameOrId))
        return (item: InventoryItem) => {
            return !!item.socketBlock && _.some(item.socketBlock.sockets, (socket) => {
                return this.intrinsicPerkSocketTypeIds.has(socket.socketTypeId) && weaponPerkIds.has(socket.initialPlugId)
            })
        }
    }

    itemWithoutIntrinsicPerkPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsFor(nameOrId))
        return (item: InventoryItem) => {
            return !!item.socketBlock && !_.some(item.socketBlock.sockets, (socket) => {
                return this.intrinsicPerkSocketTypeIds.has(socket.socketTypeId) && weaponPerkIds.has(socket.initialPlugId)
            })
        }
    }

    itemWithIntrinsicPerkInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsForAny(...namesOrIds))
        return (item: InventoryItem) => {
            return !!item.socketBlock && _.some(item.socketBlock.sockets, (socket) => {
                return this.intrinsicPerkSocketTypeIds.has(socket.socketTypeId) && weaponPerkIds.has(socket.initialPlugId)
            })
        }
    }

    itemWithoutIntrinsicPerkInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsForAny(...namesOrIds))
        return (item: InventoryItem) => {
            return !!item.socketBlock && !_.some(item.socketBlock.sockets, (socket) => {
                return this.intrinsicPerkSocketTypeIds.has(socket.socketTypeId) && weaponPerkIds.has(socket.initialPlugId)
            })
        }
    }

    itemThatCanHavePerkPredicate(nameOrId: string | number): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsFor(nameOrId))
        return (item: InventoryItem) => {
            let sockets = item.socketBlock?.sockets

            if (!sockets) {
                return false
            }

            for (let plugIds of this.getFixedPlugIdGroups(sockets)) {
                if (this.setHasAny(weaponPerkIds, plugIds)) {
                    return true
                }
            }

            for (let plugIds of this.getRandomizedPlugIdGroups(sockets)) {
                if (this.setHasAny(weaponPerkIds, plugIds)) {
                    return true
                }
            }

            return false
        }
    }

    itemThatCanHavePerkInPredicate(...namesOrIds: (string | number)[]): (item: InventoryItem) => boolean {
        let weaponPerkIds = new Set(this.weaponPerkIdsForAny(...namesOrIds))
        return (item: InventoryItem) => {
            let sockets = item.socketBlock?.sockets

            if (!sockets) {
                return false
            }

            for (let plugIds of this.getFixedPlugIdGroups(sockets)) {
                if (this.setHasAny(weaponPerkIds, plugIds)) {
                    return true
                }
            }

            for (let plugIds of this.getRandomizedPlugIdGroups(sockets)) {
                if (this.setHasAny(weaponPerkIds, plugIds)) {
                    return true
                }
            }

            return false
        }
    }

    // Weapon roll predicates
    weaponRollWithPerkPredicate(nameOrId: string | number): (roll: WeaponRoll) => boolean {
        let weaponPerkIds = this.weaponPerkIdsFor(nameOrId)
        return (roll: WeaponRoll) => roll.hasPerkIn(weaponPerkIds)
    }

    weaponRollWithPerkInPredicate(...namesOrIds: (string | number)[]): (roll: WeaponRoll) => boolean {
        let weaponPerkIds = this.weaponPerkIdsForAny(...namesOrIds)
        return (roll: WeaponRoll) => roll.hasPerkIn(weaponPerkIds)
    }

    weaponRollWithoutPerkPredicate(nameOrId: string | number): (roll: WeaponRoll) => boolean {
        let weaponPerkIds = this.weaponPerkIdsFor(nameOrId)
        return (roll: WeaponRoll) => !roll.hasPerkIn(weaponPerkIds)
    }

    weaponRollWithoutPerkInPredicate(...namesOrIds: (string | number)[]): (roll: WeaponRoll) => boolean {
        let weaponPerkIds = this.weaponPerkIdsForAny(...namesOrIds)
        return (roll: WeaponRoll) => !roll.hasPerkIn(weaponPerkIds)
    }

    // Weapon roll methods
    getWeaponPerkSockets(sockets: ItemSocketEntry[]): ItemSocketEntry[] {
        return _.filter(sockets, (socket) => {
            return this.weaponPerkSocketCategories.has(socket.socketCategoryId) &&
                !this.nonWeaponPerkSocketTypeIds.has(socket.socketTypeId)
        })
    }

    getFixedPlugIdGroups(sockets: ItemSocketEntry[]): number[][] {
        let plugIdGroups: number[][] = []
        for (let socket of sockets) {
            let plugIds: number[]
            if (socket.fixedPlugSetId) {
                plugIds = [...this.idToPlugSetMap[socket.fixedPlugSetId].plugIds]
            } else if (socket.fixedPlugIds) {
                plugIds = [...socket.fixedPlugIds]
            } else {
                plugIds = []
            }

            if (_.isEmpty(plugIds)) {
                continue
            }

            plugIdGroups.push([...plugIds])
        }
        return plugIdGroups
    }

    getRandomizedPlugIdGroups(sockets: ItemSocketEntry[]): number[][] {
        let plugIdGroups: number[][] = []
        for (let socket of sockets) {
            let plugIds: number[]
            if (socket.randomizedPlugSetId) {
                plugIds = [...this.idToPlugSetMap[socket.randomizedPlugSetId].plugIds]
            } else if (socket.fixedPlugSetId) {
                plugIds = [...this.idToPlugSetMap[socket.fixedPlugSetId].plugIds]
            } else if (socket.fixedPlugIds) {
                plugIds = [...socket.fixedPlugIds]
            } else {
                plugIds = []
            }

            if (_.isEmpty(plugIds)) {
                continue
            }

            plugIdGroups.push([...plugIds])
        }
        return plugIdGroups
    }

    * generatePlugIdCombinations(plugIdGroups: number[][]): IterableIterator<number[]> {
        if (plugIdGroups.length > 1) {
            let headPlugIds: number[] = _.head(plugIdGroups) || []
            let tailPlugIdGroups: number[][] = _.tail(plugIdGroups) || []
            for (let headPlugId of headPlugIds) {
                for (let plugCombination of this.generatePlugIdCombinations(tailPlugIdGroups)) {
                    yield [headPlugId, ...plugCombination]
                }
            }
        } else if (plugIdGroups.length == 1) {
            for (let plugId of plugIdGroups[0]) {
                yield [plugId]
            }
        } else {
            yield []
        }
    }

    * generateWeaponRolls(weapon: InventoryItem): IterableIterator<WeaponRoll> {
        if (weapon?.socketBlock?.sockets) {
            let sockets = this.getWeaponPerkSockets(weapon.socketBlock.sockets)
            let fixedPlugIdGroups = this.getFixedPlugIdGroups(sockets)
            for (let plugIds of this.generatePlugIdCombinations(fixedPlugIdGroups)) {
                yield this.weaponRollFor(weapon, plugIds, false)
            }
            let randomizedPlugIdGroups = this.getRandomizedPlugIdGroups(sockets)
            for (let plugIds of this.generatePlugIdCombinations(randomizedPlugIdGroups)) {
                yield this.weaponRollFor(weapon, plugIds, true)
            }
        }
    }

    weaponRollFor(weapon: InventoryItem, perkIds: number[], isRandomRoll: boolean): WeaponRoll {
        let perkIdSet: Set<number> = new Set(perkIds)
        let perkNames: Set<string> = new Set()
        if (!weapon.statGroupId) {
            throw new Error(`InventoryItem ${weapon.id} (${weapon.name}) does not have a statGroupId`)
        } else if (!this.idToStatGroupMap[weapon.statGroupId]) {
            throw new Error(`InventoryItem ${weapon.id} (${weapon.name}) has an invalid statGroupId (${weapon.statGroupId})`)
        }
        let statGroup: StatGroup = this.idToStatGroupMap[weapon.statGroupId]
        let displayStatBlock: DisplayStatBlock = new DisplayStatBlock(statGroup)

        for (let perkId of perkIds) {
            if (!this.idToWeaponPerkMap[perkId]) {
                throw new Error(`InventoryItem ${weapon.id} (${weapon.name}) has an invalid plugId (${perkId})`)
            }
            let plug: InventoryItem = this.idToWeaponPerkMap[perkId]
            perkNames.add(plug.name)
            displayStatBlock.addStatsFrom(plug)
        }

        let perkBlock: WeaponRollPerkBlock = new WeaponRollPerkBlock(
            isRandomRoll,
            perkIdSet,
            perkNames
        )

        return WeaponRoll.fromInventoryItem(weapon, perkBlock, displayStatBlock)
    }
}

export default ItemExplorer
