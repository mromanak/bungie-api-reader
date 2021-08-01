import _ from 'lodash';
import WeaponRoll from "../model/weaponRoll";
import ItemExplorer from "../explorer/itemExplorer";
import {DestinyItemInventoryBlockRarity} from "../model/destinyManifestDefinitions";

const inverseRegex = /^inv:/

class GeometricMeanScoringFunction {

    public header: string
    public stats: { id: number, inverse: boolean }[]

    constructor(
        itemExplorer: ItemExplorer,
        ...statNamesOrIds: (string | number)[]
    ) {
        this.header = GeometricMeanScoringFunction.headerFor(...statNamesOrIds)
        this.stats = []
        for (let statNameOrId of statNamesOrIds) {
            let transformedStatOrId = statNameOrId
            if (typeof statNameOrId == 'string' && inverseRegex.test(statNameOrId)) {
                transformedStatOrId = statNameOrId.replace(inverseRegex, '')
            }

            let statIds = itemExplorer.statIdsFor(transformedStatOrId)
            if (statIds.length == 0) {
                throw new Error(`No stat with name or ID ${transformedStatOrId}`)
            } else if (statIds.length > 1) {
                throw new Error(`Ambiguous stat name ${transformedStatOrId}. Possible values are: ${statIds.join(', ')}`)
            }
            this.stats.push({
                id: statIds[0],
                inverse: (typeof statNameOrId == 'string' && inverseRegex.test(statNameOrId))
            })
        }
    }

    static headerFor(...statNamesOrIds: (string | number)[]): string {
        let statNames = _.map(statNamesOrIds, (statNameOrId) => {
            if (typeof statNameOrId == 'number') {
                return `statId:${statNameOrId}`
            }
            return statNameOrId.replace(/inv:((?:\w|\s)+)/, '$1⁻¹')
        })

        let superscriptString = GeometricMeanScoringFunction.toSuperscript(statNames.length)
        return `${superscriptString}√(${statNames.join(' × ')})`
    }

    static toSuperscript(number: number): string {
        let superscriptChars = '⁻˙⁰¹²³⁴⁵⁶⁷⁸⁹'
        let scriptChars = '-.0123456789'
        let superscriptString = ''
        for (let char of String(number)) {
            let index = scriptChars.indexOf(char)
            if (index != -1) {
                superscriptString += superscriptChars.charAt(index)
            } else {
                superscriptString += char
            }
        }
        return superscriptString
    }

    score(roll: WeaponRoll): number {
        let score = 1.0;
        for (let stat of this.stats) {
            if (stat.inverse) {
                score *= 1.0 / roll.getDisplayStatValue(stat.id)
            } else {
                score *= roll.getDisplayStatValue(stat.id)
            }
        }
        return score ** (1.0 / this.stats.length)
    }
}

class UniqueArchetypeUtils {

    public sortFunctions: ((roll: WeaponRoll) => number | string)[]
    public sortDirections: ('asc' | 'desc')[]
    public uniqueByFunction: (roll: WeaponRoll) => string

    constructor(
        itemExplorer: ItemExplorer
    ) {
        let rpmStatId = itemExplorer.statIdsFor('Rounds Per Minute')[0]
        let impactStatId = itemExplorer.statIdsFor('Impact')[0]

        let detailedArchetypeMapper = UniqueArchetypeUtils.detailedArchetypeForRoll(itemExplorer)
        this.sortFunctions = [
            (roll) => roll.itemTypeDisplayName,
            (roll) => roll?.statIdToBaseValueMap?.[impactStatId] != undefined ? roll.displayStatsBlock.statGroup.interpolate(impactStatId, roll.statIdToBaseValueMap[impactStatId]) : 'Unknown',
            (roll) => roll?.statIdToBaseValueMap?.[rpmStatId] != undefined ? roll.displayStatsBlock.statGroup.interpolate(rpmStatId, roll.statIdToBaseValueMap[rpmStatId]) : 'Unknown',
            detailedArchetypeMapper,
            (roll) => itemExplorer.idToDamageTypeMap[roll?.damageTypeId || 0]?.enumValue || 'Unknown'
        ]
        this.sortDirections = [
            'asc', 'desc', 'asc', 'asc', 'asc'
        ]
        this.uniqueByFunction = (roll: WeaponRoll): string => {
            let differentiators: (number | string)[] = [
                roll.itemTypeDisplayName,
                detailedArchetypeMapper(roll),
                roll?.statIdToBaseValueMap?.[rpmStatId] || 'Unknown',
                roll?.statIdToBaseValueMap?.[impactStatId] || 'Unknown',
                itemExplorer.idToDamageTypeMap[roll?.damageTypeId || 0]?.enumValue || 'Unknown'
            ]
            return differentiators.join('/')
        }
    }
    
    static detailedArchetypeForRoll(itemExplorer: ItemExplorer): (roll: WeaponRoll) => string {
        return (roll: WeaponRoll): string => {
            let frameName;
            let frameId;
            if (roll.rarity == DestinyItemInventoryBlockRarity.EXOTIC) {
                frameName = 'Exotic';
            } else {
                let frameSocket = _.find(roll.socketBlock?.sockets, (socket) => {
                    return itemExplorer.intrinsicPerkSocketTypeIds.has(socket.socketTypeId)
                })

                if (!frameSocket || !itemExplorer.idToWeaponPerkMap[frameSocket.initialPlugId]) {
                    frameName = 'Unknown'
                } else {
                    frameId = frameSocket.initialPlugId
                    frameName = itemExplorer.idToWeaponPerkMap[frameSocket.initialPlugId].name
                }
            }
            
            let rpmStatId = itemExplorer.statIdsFor('Rounds Per Minute')[0]
            let chargeTimeStatId = itemExplorer.statIdsFor('Charge Time')[0]
            let drawTimeStatId = itemExplorer.statIdsFor('Draw Time')[0]
            
            let suffix
            if (roll.statIdToBaseValueMap?.[rpmStatId] != undefined) {
                let rpmStat = roll.displayStatsBlock.statGroup.interpolate(rpmStatId, roll.statIdToBaseValueMap[rpmStatId])
                let frameIdString = frameId ? ` / id:${frameId}` : ''
                suffix = ` (${rpmStat} RPM${frameIdString})`
            } else if (roll.statIdToBaseValueMap?.[chargeTimeStatId] != undefined) {
                let chargeTimeStat = roll.displayStatsBlock.statGroup.interpolate(chargeTimeStatId, roll.statIdToBaseValueMap[chargeTimeStatId])
                let frameIdString = frameId ? ` / id:${frameId}` : ''
                suffix = ` (${chargeTimeStat} ms${frameIdString})`
            } else if (roll.statIdToBaseValueMap?.[drawTimeStatId] != undefined) {
                let drawTimeStat = roll.displayStatsBlock.statGroup.interpolate(drawTimeStatId, roll.statIdToBaseValueMap[drawTimeStatId])
                let frameIdString = frameId ? ` / id:${frameId}` : ''
                suffix = ` (${drawTimeStat} ms${frameIdString})`
            } else {
                suffix = frameId ? ` (id:${frameId})` : ''
            }

            return frameName + suffix
        }
    }
}

export {
    GeometricMeanScoringFunction,
    UniqueArchetypeUtils
}