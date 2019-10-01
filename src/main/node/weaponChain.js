const _ = require('lodash')
const ApiContext = require('./apiContext')

class WeaponChain {

  constructor (context, weapons) {
    if (!context instanceof ApiContext) {
      throw new Error(
        `Unexpected type for context parameter, expected ApiContext but got ${typeof context}`)
    }

    if (_.isUndefined(weapons) || !_.isArray(weapons)) {
      throw new Error(
        `Unexpected type for weapons parameter, expected array but got ${typeof weapons}`)
    }

    this.isExpanded = false
    this.context = context
    this.chain = _.chain(weapons)
  }

  toConfigurations () {
    if (this.isExpanded) {
      return this
    }
    this.chain = this.chain.flatMap((weapon) => [
      ...this.context.getCuratedModConfigurations(weapon),
      ...this.context.getRandomModConfigurations(weapon)
    ])
    this.isExpanded = true
    return this
  }

  withNames (...names) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => _.includes(names, config.weaponName))
    } else {
      this.chain = this.chain.
        filter((weapon) => _.includes(names, weapon.name))
    }
    return this
  }

  withNamesMatching (nameRegex) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => nameRegex.test(config.weaponName))
    } else {
      this.chain = this.chain.
        filter((weapon) => nameRegex.test(weapon.name))
    }
    return this
  }

  withTypes (...typeNames) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.hasType(...typeNames))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.hasType(...typeNames))
    }
    return this
  }

  withIntrinsics (...intrinsicPlugNames) {
    let intrinsicPlugIds = this.context.getModIdsByName(...intrinsicPlugNames)
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.hasIntrinsicPlug(...intrinsicPlugIds))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.hasIntrinsicPlug(...intrinsicPlugIds))
    }
    return this
  }

  inBuckets (...bucketNames) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.isInBucket(...bucketNames))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.isInBucket(...bucketNames))
    }
    return this
  }

  withDamageTypes (...damageTypeNames) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.hasDamageType(...damageTypeNames))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.hasDamageType(...damageTypeNames))
    }
    return this
  }

  withRarities (...rarities) {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.hasTier(...rarities))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.hasTier(...rarities))
    }
    return this
  }

  withFixedRolls () {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.rolls.fixedRoll)
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.rolls.fixedRoll)
    }
    return this
  }

  withoutFixedRolls () {
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => !config.weapon.rolls.fixedRoll)
    } else {
      this.chain = this.chain.
        filter((weapon) => !weapon.rolls.fixedRoll)
    }
    return this
  }

  withStats (...statNames) {
    let statIds = _.map(statNames, (statName) => {
      return this.context.getStatIdByName(statName)
    })
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => {
          return _.every(statIds, (statId) => {
            return config.weapon.statBlock.hasStat(statId)
          })
        })
    } else {
      this.chain = this.chain.
        filter((weapon) => {
          return _.every(statIds, (statId) => {
            return weapon.statBlock.hasStat(statId)
          })
        })
    }
    return this
  }

  withDisplayStatLt (statName, statValue) {
    if (!this.isExpanded) {
      throw new Error(
        'withDisplayStatLt() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.filter((config) => {
      return config.displayStats[statName] < statValue
    })
    return this
  }

  withDisplayStatLte (statName, statValue) {
    if (!this.isExpanded) {
      throw new Error(
        'withDisplayStatLte() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.filter((config) => {
      return config.displayStats[statName] <= statValue
    })
    return this
  }

  withDisplayStat (statName, statValue) {
    if (!this.isExpanded) {
      throw new Error(
        'withDisplayStat() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.filter((config) => {
      return config.displayStats[statName] === statValue
    })
    return this
  }

  withDisplayStatGte (statName, statValue) {
    if (!this.isExpanded) {
      throw new Error(
        'withDisplayStatGte() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.filter((config) => {
      return config.displayStats[statName] >= statValue
    })
    return this
  }

  withDisplayStatGt (statName, statValue) {
    if (!this.isExpanded) {
      throw new Error(
        'withDisplayStatGt() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.filter((config) => {
      return config.displayStats[statName] > statValue
    })
    return this
  }

  addRawDisplayStats (...statNames) {
    if (!this.isExpanded) {
      throw new Error(
        'addRawDisplayStats() cannot be called before toConfigurations()')
    }

    this.chain = this.chain.each((config) => {
      if (!_.has(config, 'rawStats')) {
        config.rawStats = {}
      }

      for (let statName of statNames) {
        let statId = this.context.getStatIdByName(statName)
        let rawValue = config.weapon.statBlock.getRawStat(statId)
        let statGroup = this.context.getStatGroupById(config.weapon.statGroupId)
        let rawDisplayValue = statGroup.interpolate(statId, rawValue)
        config.rawStats[statName] = rawDisplayValue
      }
    })
    return this
  }

  thatCanHaveMods (...nameSpecs) {
    let plugSpecs = this.context.plugSpecForModNames(...nameSpecs)
    if (this.isExpanded) {
      this.chain = this.chain.
        filter((config) => config.weapon.canHaveAllPlugs(...plugSpecs))
    } else {
      this.chain = this.chain.
        filter((weapon) => weapon.canHaveAllPlugs(...plugSpecs))
    }
    return this
  }

  thatUseMods (...nameSpecs) {
    if (!this.isExpanded) {
      throw new Error(
        'thatUseMods() cannot be called before toConfigurations()')
    }

    let plugSpec = this.context.plugSpecForModNames(...nameSpecs)
    this.chain = this.chain.
      filter((config) => matchesSpec(config.modNames, nameSpecs))
    return this
  }

  sortedBy (sortFunctions, ...sortDirections) {
    this.chain = this.chain.orderBy(sortFunctions, sortDirections)
    return this
  }

  uniqueByWeaponId() {
    if (!this.isExpanded) {
      return this
    }
    this.chain = this.chain.uniqBy((config) => config.weapon.id)
    return this
  }

  map (mappingFunction) {
    return this.chain.map(mappingFunction)
  }

  getChain () {
    return this.chain
  }

  values () {
    return this.chain.values()
  }
}

function matchesSpec (array, specs) {
  for (let spec of specs) {
    if (_.isNumber(spec) || _.isString(spec)) {
      if (!_.includes(array, spec)) {
        return false
      }
    } else if (_.isArray(spec)) {
      if (!_.some(spec, (alternateSpec) => _.includes(array, alternateSpec))) {
        return false
      }
    }
  }
  return true
}

module.exports = WeaponChain
