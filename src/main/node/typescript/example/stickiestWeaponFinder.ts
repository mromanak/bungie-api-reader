// To run (from project root):
// node src/main/node/node_modules/ts-node/dist/bin.js src/main/node/typescript/example/stickiestWeaponFinder.ts

import _ from 'lodash'
import ItemExplorer from "../explorer/itemExplorer";
import WeaponChain from "../explorer/weaponChain";
import {DestinyItemInventoryBlockRarity} from "../model/destinyManifestDefinitions";
import WeaponRollChain from "../explorer/weaponRollChain";
import {GeometricMeanScoringFunction, UniqueArchetypeUtils} from "./sortingUtils";
import {CsvRollStringifier} from "./printingUtils";

async function run() {
    const filePath = '/Users/mromanak/Documents/IntelliJ/bungie-api-reader/data/current'
    const itemExplorer = new ItemExplorer(filePath)
    try {
        await itemExplorer.init()
        let statsToCompare = ['Range', 'Stability', 'Aim Assistance']
        let scoringFunction = new GeometricMeanScoringFunction(itemExplorer, ...statsToCompare)
        let archetypeUtils = new UniqueArchetypeUtils(itemExplorer)

        let weapons = new WeaponChain(itemExplorer)
            .excludingBetaItems()
            .withRarityEq(DestinyItemInventoryBlockRarity.LEGENDARY)
            .withPowerCapGte(1320)
            .withAllStats(...statsToCompare)

        let weaponRolls = new WeaponRollChain(weapons)
            // TODO Figure out how to split EC into multiple perks, rather than pretending it gives all bonuses at once
            .withoutPerk('Elemental Capacitor')
            .sortedBy((roll) => scoringFunction.score(roll), 'desc')
            .uniqueById()
            .sortedBy([...archetypeUtils.sortFunctions], ...archetypeUtils.sortDirections)
            .uniqueBy(archetypeUtils.uniqueByFunction)

        let itemWriter = new CsvRollStringifier(itemExplorer, {
            columns: ['id', 'name', 'rarity', 'rollType', 'itemType', {
                id: 'archetype',
                title: 'Archetype',
                extractor: UniqueArchetypeUtils.detailedArchetypeForRoll(itemExplorer)
            }, 'damageType', {
                id: 'score',
                title: scoringFunction.header,
                extractor: roll => scoringFunction.score(roll)
            }, {
                id: 'mods',
                title: 'Mods',
                extractor: roll => {
                    return [...roll.displayStatsBlock.statContributorsFor(..._.map(scoringFunction.stats, 'id'))]
                        .join('/')
                }
            }, 'displayRange', 'displayStability', 'displayAimAssistance']
        })
        console.log(itemWriter.stringifyAll(weaponRolls, true))
    } catch (err) {
        console.error(`An error occurred while running weaponFinder.ts: ${err.message}\n${err.stack}`)
        process.exitCode = 1
    } finally {
        await itemExplorer.destroy()
    }
}

run().finally(() => {
    process.exit()
})
