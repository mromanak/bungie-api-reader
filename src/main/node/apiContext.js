require('sqlite3')

const _ = require('lodash')
const Promise = require('bluebird')
const Mod = require('./mod')
const ModConfiguration = require('./modConfiguration')
const PlugSet = require('./PlugSet')
const StatDefinition = require('./stat')
const StatGroupDefinition = require('./statGroup')
const Weapon = require('./weapon')

class ApiContext {
  constructor (knex) {
    if (!knex) {
      throw new Error('knex must be defined')
    }

    this.knex = knex
  }

  async ready () {
    this.stats = await this.cacheStats()
    this.statGroupDefinitions = await this.cacheStatGroups()
    this.mods = await this.cacheMods()
    this.plugSets = await this.cachePlugSets()
    this.weapons = await this.cacheWeapons(this.plugSets)
    return this
  }

  cacheStats () {
    return this.knex.
      select('*').
      from('DestinyStatDefinition').
      then((results) => parseResults(StatDefinition.parse, results))
  }

  getStatById (statId) {
    return this.stats[statId]
  }

  getStatIdByName (statName) {
    return _.chain(this.stats).
      filter((stat) => stat.name === statName).
      map((stat) => stat.id).
      // Assuming stats are unique by name. Not true for Defense, but I'm not programming around that
      first().
      value()
  }

  getAllStatDefinitions () {
    return _.values(this.stats)
  }

  cacheStatGroups () {
    return this.knex.
      select('*').
      from('DestinyStatGroupDefinition').
      then((results) => parseResults(StatGroupDefinition.parse, results))
  }

  getStatGroupById (statGroupId) {
    return this.statGroupDefinitions[statGroupId]
  }

  getAllStatGroupDefinitions () {
    return _.values(this.statGroupDefinitions)
  }

  cacheMods () {
    return this.knex.
      select('*').
      from('DestinyInventoryItemDefinition').
      joinRaw('JOIN json_each(DestinyInventoryItemDefinition.json, \'$.itemCategoryHashes\') category').
      where('value', 610365472).
      then((results) => parseResults(Mod.parse, results))
  }

  getModById (modId) {
    return this.mods[modId]
  }

  getModsById (...modIds) {
    return _.chain(modIds).
      map((modId) => this.mods[modId]).
      compact().
      value()
  }

  getModsByName (...modNames) {
    let nameSet = new Set(modNames)
    return _.chain(this.mods).
      filter((mod) => nameSet.has(mod.name)).
      value()
  }

  getModIdsByName (...modNames) {
    let nameSet = new Set(modNames)
    return _.chain(this.mods).
      filter((mod) => nameSet.has(mod.name)).
      map((mod) => mod.id).
      value()
  }

  plugSpecForModNames (...nameSpecs) {
    let plugSpec = []
    for (let nameSpec of nameSpecs) {
      let mods
      if (_.isString(nameSpec)) {
        mods = this.getModsByName(nameSpec)
      } else if (_.isArray(nameSpec)) {
        mods = this.getModsByName(...nameSpec)
      } else {
        throw new Error(`Unexpected type for nameSpec parameter. Expected number or array, but got ${typeof nameSpec}`)
      }

      if (_.isEmpty(mods)) {
        console.warn(`No mods found for name spec ${nameSpec}`)
        continue
      }
      if (mods.length === 1) {
        plugSpec.push(mods[0].id)
      } else {
        plugSpec.push(_.map(mods, (mod) => mod.id))
      }
    }
    return plugSpec
  }

  getAllMods () {
    return _.values(this.mods)
  }

  cacheWeapons (plugSets) {
    return this.knex.
      select('*').
      from('DestinyInventoryItemDefinition').
      where(this.knex.raw('json_extract(json, \'$.itemType\') = 3')).
      then((results) => parseResults(json => Weapon.parse(json, plugSets), results))
  }

  getWeaponById (weaponId) {
    return this.weapons[weaponId]
  }

  getWeaponsById (...weaponIds) {
    return _.chain(weaponIds).
      map((weaponId) => this.weapons[weaponId]).
      compact().
      value()
  }

  getWeaponsByName (...weaponNames) {
    let nameSet = new Set(weaponNames)
    return _.chain(this.weapons).
      filter((weapon) => nameSet.has(weapon.name)).
      value()
  }

  getAllWeapons () {
    return _.values(this.weapons)
  }

  getCuratedModConfigurations(weapon) {
    let sockets = weapon.rolls.sockets
    let combinations = this.getModCombinations(sockets, getCuratedPlugIds)
    return this.attachDisplayStats(weapon, combinations, true)
  }

  getRandomModConfigurations(weapon) {
    let sockets = weapon.rolls.sockets
    let combinations = this.getModCombinations(sockets, getRandomPlugIds)
    return this.attachDisplayStats(weapon, combinations, false)
  }

  getModCombinations(sockets, getPlugIds) {
    if(_.isEmpty(sockets)) {
      return []
    } else if (sockets.length === 1) {
      let socket = sockets[0]
      let plugIds = getPlugIds(socket)
      if (_.isEmpty(plugIds)) {
        return [[]]
      }
      return _.map(plugIds, (plugId) => [this.getModById(plugId)])
    }

    let headSocket = _.head(sockets)
    let tailSockets = _.tail(sockets)
    let combinations = []
    let plugIds = getPlugIds(headSocket)
    if(_.isEmpty(plugIds)) {
      return this.getModCombinations(tailSockets, getPlugIds)
    }

    for (let plugId of plugIds) {
      let mod = this.getModById(plugId)
      let subCombinations = this.getModCombinations(tailSockets, getPlugIds)
      for (let subCombination of subCombinations) {
        let combination = [mod, ...subCombination]
        combinations.push(combination)
      }
    }
    return combinations
  }

  attachDisplayStats(weapon, modCombinations, isCurated) {
    return _.map(modCombinations, (modList) => {
      let modConfiguration = new ModConfiguration(modList)
      let mergedStatBlock = weapon.statBlock.merge(modConfiguration.statBlock)
      let statGroup = this.getStatGroupById(weapon.statGroupId)
      let displayStatMap = mergedStatBlock.getDisplayStatMap(statGroup)
      let displayStats = _.mapKeys(displayStatMap, (stat, statId) => {
        let name = this.stats[statId].name
        if(_.isEmpty(name)) {
          return `stat:${statId}`
        }
        return name
      })
      let modContributions = _.mapKeys(modConfiguration.modContributions,
        (names, statId) => {
          let name = this.stats[statId].name
          if (_.isEmpty(name)) {
            return `stat:${statId}`
          }
          return name
        })
      return {
        weaponId: weapon.id,
        weaponName: weapon.name,
        modIds: _.map(modConfiguration.mods, (mod) => mod.id),
        modNames: _.map(modConfiguration.mods, (mod) => mod.name),
        modContributions,
        isCurated,
        displayStats,
        weapon,
        modConfiguration
      }
    })
  }

  cachePlugSets() {
    return this.knex.
      select('*').
      from('﻿DestinyPlugSetDefinition').
      then((results) => parseResults(PlugSet.parse, results))
  }
}

function getCuratedPlugIds(socket) {
  if(_.isUndefined(socket.curatedPlugIds)) {
    return []
  }
  return socket.curatedPlugIds
}

function getRandomPlugIds(socket) {
  if(_.isUndefined(socket.randomPlugIds)) {
    return []
  }
  return socket.randomPlugIds
}

function parseResults (parserFunction, results) {
  return _.chain(results).
    map((result) => parserFunction(result.json)).
    keyBy('id').
    value()
}

module.exports = ApiContext
