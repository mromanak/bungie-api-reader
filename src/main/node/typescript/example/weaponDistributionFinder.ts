// To run (from project root):
// node src/main/node/node_modules/ts-node/dist/bin.js src/main/node/typescript/example/weaponDistributionFinder.ts

import _ from "lodash";
import {createObjectCsvStringifier} from 'csv-writer'
import {DestinyItemInventoryBlockRarity} from "../model/destinyManifestDefinitions";
import InventoryItem, {ItemSocketEntry} from "../model/inventoryItem";
import ItemExplorer from "../explorer/itemExplorer";
import WeaponChain from "../explorer/weaponChain";

interface WeaponTypeMap {
    typeToArchetypeMap: {[weaponTypeName: string]: WeaponTypeMapTypeEntry}
}

interface WeaponTypeMapTypeEntry {
    typeName: string
    archetypeToDamageTypeMap: {[archetypeId: number]: WeaponTypeMapArchetypeEntry}
}

interface WeaponTypeMapArchetypeEntry {
    archetypeId: number
    archetypeName: string
    rpmLikeStat: string
    impactStat: number
    damageTypeToWeaponNamesMap: {[damageTypeId: number]: WeaponTypeMapDamageEntry}
}

interface WeaponTypeMapDamageEntry {
    damageTypeId: number
    damageTypeName: string
    damageTypeEnumValue: number,
    weaponNames: string[]
}

async function run() {
    const filePath = '/Users/mromanak/Documents/IntelliJ/bungie-api-reader/data/current'
    const itemExplorer = new ItemExplorer(filePath)
    try {
        await itemExplorer.init()
        let typeMap: WeaponTypeMap = {
            typeToArchetypeMap: {}
        }
        let weapons = new WeaponChain(itemExplorer)
            .excludingBetaItems()
            .withRarityEq(DestinyItemInventoryBlockRarity.LEGENDARY)
            .withPowerCapGte(1320)

        for (let weapon of weapons) {
            let archetypeId = getArchetypeId(itemExplorer, weapon)
            if (archetypeId == undefined) {
                continue
            }
            let archetypeName = itemExplorer.idToWeaponPerkMap[archetypeId]?.name
            if (archetypeName == undefined) {
                continue
            }
            let rpmLikeStat = getRpmLikeStat(itemExplorer, weapon)
            if (rpmLikeStat == undefined) {
                continue
            }
            let impactStatId = itemExplorer.statIdsFor('Impact')[0]
            let blastRadiusStatId = itemExplorer.statIdsFor('Blast Radius')[0]
            let impactStat = getStat(itemExplorer, weapon, impactStatId) || getStat(itemExplorer, weapon, blastRadiusStatId)
            if (impactStat == undefined) {
                continue
            }
            let damageTypeId = weapon.damageTypeId
            if (damageTypeId == undefined) {
                continue
            }

            if (!typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName]) {
                typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName] = {
                    typeName: weapon.itemTypeDisplayName,
                    archetypeToDamageTypeMap: {}
                }
            }
            if (!typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName].archetypeToDamageTypeMap[archetypeId]) {
                typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName].archetypeToDamageTypeMap[archetypeId] = {
                    archetypeId,
                    archetypeName,
                    rpmLikeStat,
                    impactStat,
                    damageTypeToWeaponNamesMap: {}
                }
            }
            if (!typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName].archetypeToDamageTypeMap[archetypeId].damageTypeToWeaponNamesMap[damageTypeId]) {
                typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName].archetypeToDamageTypeMap[archetypeId].damageTypeToWeaponNamesMap[damageTypeId] = {
                    damageTypeId,
                    damageTypeName: itemExplorer.idToDamageTypeMap[damageTypeId].name,
                    damageTypeEnumValue: itemExplorer.idToDamageTypeMap[damageTypeId].enumValue,
                    weaponNames: []
                }
            }
            typeMap.typeToArchetypeMap[weapon.itemTypeDisplayName].archetypeToDamageTypeMap[archetypeId].damageTypeToWeaponNamesMap[damageTypeId].weaponNames.push(weapon.name)
        }

        let rows: any[] = []
        for (let typeEntry of _.orderBy(typeMap.typeToArchetypeMap, (entry) => entry.typeName)) {
            for (let archetypeEntry of _.orderBy(typeEntry.archetypeToDamageTypeMap, [(entry) => entry.impactStat, (entry) => entry.rpmLikeStat, (entry) => entry.archetypeName], ['desc', 'asc', 'asc'])) {
                let row: any = {
                    type: typeEntry.typeName,
                    archetype: archetypeEntry.archetypeName,
                    impact: archetypeEntry.impactStat,
                    rpmStat: archetypeEntry.rpmLikeStat
                }
                for (let damageTypeEntry of _.orderBy(archetypeEntry.damageTypeToWeaponNamesMap, (entry) => entry.damageTypeEnumValue)) {
                    row[damageTypeEntry.damageTypeName] = _.sortBy(damageTypeEntry.weaponNames).join('\n')
                }
                rows.push(row)
            }
        }

        let csvStringifier = createObjectCsvStringifier({
            header: [
                {
                    id: 'type',
                    title: 'Type'
                },
                {
                    id: 'archetype',
                    title: 'Archetype'
                },
                {
                    id: 'impact',
                    title: 'Impact'
                },
                {
                    id: 'rpmStat',
                    title: 'RoF Stat'
                },
                {
                    id: 'Kinetic',
                    title: 'Kinetic'
                },
                {
                    id: 'Arc',
                    title: 'Arc'
                },
                {
                    id: 'Solar',
                    title: 'Solar'
                },
                {
                    id: 'Void',
                    title: 'Void'
                },
                {
                    id: 'Stasis',
                    title: 'Stasis'
                }
            ]
        })
        console.log(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows))
    } catch (err) {
        console.error(`An error occurred while running weaponFinder.ts: ${err.message}\n${err.stack}`)
        process.exitCode = 1
    } finally {
        await itemExplorer.destroy()
    }
}

function getArchetypeId(itemExplorer: ItemExplorer, weapon: InventoryItem) {
    return _.find(weapon?.socketBlock?.sockets, (socket: ItemSocketEntry) => {
        return itemExplorer.intrinsicPerkSocketTypeIds.has(socket.socketTypeId)
    })?.initialPlugId
}

function getRpmLikeStat(itemExplorer: ItemExplorer, weapon: InventoryItem) {
    if (weapon.statIdToBaseValueMap == undefined) {
        return undefined
    }

    let chargeTimeStatId = itemExplorer.statIdsFor('Charge Time')[0]
    let drawTimeStatId = itemExplorer.statIdsFor('Draw Time')[0]
    let rpmStatId = itemExplorer.statIdsFor('Rounds Per Minute')[0]
    let impactStatId = itemExplorer.statIdsFor('Impact')[0]

    if (weapon.statIdToBaseValueMap[chargeTimeStatId] != undefined && weapon.itemTypeDisplayName != 'Sword') {
        return `${getStat(itemExplorer, weapon, chargeTimeStatId)} ms`
    } else if (weapon.statIdToBaseValueMap[drawTimeStatId] != undefined) {
        return `${getStat(itemExplorer, weapon, drawTimeStatId)} ms`
    } else if (weapon.statIdToBaseValueMap[rpmStatId] != undefined) {
        return `${getStat(itemExplorer, weapon, rpmStatId)} RPM`
    } else if (weapon.statIdToBaseValueMap[impactStatId] != undefined) {
        return `${getStat(itemExplorer, weapon, impactStatId)} Impact`
    } else {
        return undefined
    }
}

function getStat(itemExplorer: ItemExplorer, weapon: InventoryItem, statId: number) {
    if (weapon.statGroupId == undefined) {
        return undefined
    }
    let statGroup = itemExplorer.idToStatGroupMap[weapon.statGroupId]
    let baseStatValue = weapon?.statIdToBaseValueMap?.[statId]
    if (baseStatValue == undefined) {
        return undefined
    }
    return statGroup.interpolate(statId, baseStatValue)
}


run().finally(() => {
    process.exit()
})
