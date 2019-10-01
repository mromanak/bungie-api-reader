
class Retired {
  getStatSpreadByName (weapon, statName) {
    let statId = this.getStatIdByName(statName)
    if (!weapon.statBlock.hasStat(statId)) {
      return undefined
    }

    return {
      statId,
      statName,
      curated: this.getStatSpreadForCuratedRoll(weapon, statId),
      random: this.getStatSpreadForRandomRoll(weapon, statId)
    }
  }

  getStatSpreadForCuratedRoll (weapon, statId) {
    let baseStat = weapon.statBlock.getRawStat(statId)
    let statGroup = this.getStatGroupById(weapon.statGroupId)
    let configurations = this.generateCuratedConfigurations(
      weapon.rolls.sockets)
    let maxDisplayValue = Number.MIN_SAFE_INTEGER
    let minDisplayValue = Number.MAX_SAFE_INTEGER
    let maxConfigurations = new Set()
    let minConfigurations = new Set()
    let hasNeutralMaxConfigurations = false
    let hasNeutralMinConfigurations = false

    if (_.isUndefined(configurations)) {
      return undefined
    }

    for (let configuration of configurations) {
      let adjustment = 0
      let modNames = []
      for (let mod of configuration) {
        let modAdjustment = mod.statBlock.getRawStat(statId)
        if (modAdjustment !== 0) {
          modNames.push(mod.name)
          adjustment += modAdjustment
        }
      }

      // Sets can only be equal by reference, so convert to strings to check by value
      let modNamesString = JSON.stringify(modNames)
      let rawValue = baseStat + adjustment
      let displayValue = statGroup.interpolate(statId, rawValue)
      if (displayValue > maxDisplayValue) {
        maxDisplayValue = displayValue
        if (modNames.length === 0) {
          hasNeutralMaxConfigurations = true
          maxConfigurations = new Set()
        } else {
          hasNeutralMaxConfigurations = false
          maxConfigurations = new Set([modNamesString])
        }
      } else if (displayValue === maxDisplayValue) {
        if (modNames.length === 0) {
          hasNeutralMaxConfigurations = true
        } else {
          maxConfigurations.add(modNamesString)
        }
      }
      if (displayValue < minDisplayValue) {
        minDisplayValue = displayValue
        if (modNames.length === 0) {
          hasNeutralMinConfigurations = true
          minConfigurations = new Set()
        } else {
          hasNeutralMinConfigurations = false
          minConfigurations = new Set([modNamesString])
        }
      } else if (displayValue === minDisplayValue) {
        if (modNames.length === 0) {
          hasNeutralMinConfigurations = true
        } else {
          minConfigurations.add(modNamesString)
        }
      }
    }

    if (maxDisplayValue === minDisplayValue) {
      return {
        canChange: false,
        maxDisplayValue,
        minDisplayValue
      }
    } else {
      return {
        canChange: true,
        maxDisplayValue,
        hasNeutralMaxConfigurations,
        maxConfigurations: _.map([...maxConfigurations],
          (names) => JSON.parse(names)),
        minDisplayValue,
        hasNeutralMinConfigurations,
        minConfigurations: _.map([...minConfigurations],
          (names) => JSON.parse(names))
      }
    }
  }

  generateCuratedConfigurations (sockets) {
    if (sockets.length === 1) {
      return _.chain(sockets[0].curatedPlugIds).
        map((plugId) => [this.getModById(plugId)]).
        value()
    }

    let nextSocket = _.head(sockets)
    let otherSockets = _.tail(sockets)
    let configurations = []
    for (let plugId of nextSocket.curatedPlugIds) {
      let mod = this.getModById(plugId)
      let nextConfigurations = this.generateCuratedConfigurations(otherSockets)
      for (let configuration of nextConfigurations) {
        configurations.push([mod, ...configuration])
      }
    }
    return configurations
  }

  getStatSpreadForRandomRoll (weapon, statId) {
    if (weapon.rolls.fixedRoll) {
      return undefined
    }

    let baseStat = weapon.statBlock.getRawStat(statId)
    let statGroup = this.getStatGroupById(weapon.statGroupId)
    let configurations = this.generateRandomConfigurations(weapon.rolls.sockets)
    let maxDisplayValue = Number.MIN_SAFE_INTEGER
    let minDisplayValue = Number.MAX_SAFE_INTEGER
    let maxConfigurations = new Set()
    let minConfigurations = new Set()
    let hasNeutralMaxConfigurations = false
    let hasNeutralMinConfigurations = false

    for (let configuration of configurations) {
      let adjustment = 0
      let modNames = []
      for (let mod of configuration) {
        let modAdjustment = mod.statBlock.getRawStat(statId)
        if (modAdjustment !== 0) {
          modNames.push(mod.name)
          adjustment += modAdjustment
        }
      }

      // Sets can only be equal by reference, so convert to strings to check by value
      let modNamesString = JSON.stringify(modNames)
      let rawValue = baseStat + adjustment
      let displayValue = statGroup.interpolate(statId, rawValue)
      if (displayValue > maxDisplayValue) {
        maxDisplayValue = displayValue
        if (modNames.length === 0) {
          hasNeutralMaxConfigurations = true
          maxConfigurations = new Set()
        } else {
          hasNeutralMaxConfigurations = false
          maxConfigurations = new Set([modNamesString])
        }
      } else if (displayValue === maxDisplayValue) {
        if (modNames.length === 0) {
          hasNeutralMaxConfigurations = true
        } else {
          maxConfigurations.add(modNamesString)
        }
      }
      if (displayValue < minDisplayValue) {
        minDisplayValue = displayValue
        if (modNames.length === 0) {
          hasNeutralMinConfigurations = true
          minConfigurations = new Set()
        } else {
          hasNeutralMinConfigurations = false
          minConfigurations = new Set([modNamesString])
        }
      } else if (displayValue === minDisplayValue) {
        if (modNames.length === 0) {
          hasNeutralMinConfigurations = true
        } else {
          minConfigurations.add(modNamesString)
        }
      }
    }

    if (maxDisplayValue === minDisplayValue) {
      return {
        canChange: false,
        maxDisplayValue,
        minDisplayValue
      }
    } else {
      return {
        canChange: true,
        maxDisplayValue,
        hasNeutralMaxConfigurations,
        maxConfigurations: _.map([...maxConfigurations],
          (names) => JSON.parse(names)),
        minDisplayValue,
        hasNeutralMinConfigurations,
        minConfigurations: _.map([...minConfigurations],
          (names) => JSON.parse(names))
      }
    }
  }

  generateRandomConfigurations (sockets) {
    if (sockets.length === 1) {
      return _.chain(sockets[0].randomPlugIds).
        map((plugId) => [this.getModById(plugId)]).
        value()
    }

    let nextSocket = _.head(sockets)
    let otherSockets = _.tail(sockets)
    let configurations = []
    for (let plugId of nextSocket.randomPlugIds) {
      let mod = this.getModById(plugId)
      let nextConfigurations = this.generateRandomConfigurations(otherSockets)
      for (let configuration of nextConfigurations) {
        configurations.push([mod, ...configuration])
      }
    }
    return configurations
  }
}