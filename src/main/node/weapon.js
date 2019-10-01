const _ = require('lodash')
const StatBlock = require('./statBlock')

class Weapon {

  constructor (rawJson) {
    this.rawJson = rawJson
    this.id = rawJson.hash
    this.name = rawJson.displayProperties.name
    this.description = rawJson.displayProperties.description
    this.tierId = rawJson.inventory.tierType
    this.tier = rawJson.inventory.tierTypeName
    this.type = rawJson.itemTypeDisplayName
    this.damageTypeId = rawJson.defaultDamageType
    this.damageType = parseDamageType(rawJson.defaultDamageType)
    this.bucketId = rawJson.inventory.bucketTypeHash
    this.bucket = parseBucket(rawJson.inventory.bucketTypeHash)
    this.statGroupId = rawJson.stats.statGroupHash
    this.statBlock = this.parseBaseStatBlock(rawJson.investmentStats)
    this.rolls = this.parseRolls(rawJson.sockets)
  }

  static parse (json) {
    if (typeof json === 'string') {
      return new Weapon(JSON.parse(json))
    } else if (typeof json === 'object') {
      return new Weapon(json)
    } else {
      throw new Error(
        `Unexpected type for json parameter. Expected string or object, but got ${typeof json}`)
    }
  }

  parseBaseStatBlock (investmentStats) {
    let baseStatBlock = new StatBlock()
    _.each(investmentStats, (investmentStat) => {
      baseStatBlock.addStat(investmentStat.statTypeHash, investmentStat.value)
    })
    return baseStatBlock
  }

  parseRolls (sockets) {
    let rolls = {
      intrinsicPlugId: null,
      fixedRoll: true,
      sockets: []
    }

    let socketEntries = sockets.socketEntries
    let curatedPlugIds = new Set()
    let randomPlugIds = new Set()
    let perkSocketIndexes = new Set()
    let weaponPerkSocketCategory = _.first(sockets.socketCategories,
      (socketCategory) => socketCategory.socketCategoryHash === 4241085061)
    if (weaponPerkSocketCategory) {
      _.each(weaponPerkSocketCategory.socketIndexes, (index) => {
        perkSocketIndexes.add(index)
      })
    }

    rolls.intrinsicPlugId = socketEntries[0].singleInitialItemHash
    for (let i = 1; i < socketEntries.length; i++) {
      if (!perkSocketIndexes.has(i)) {
        continue
      }

      let socketEntry = socketEntries[i]
      if (socketEntry.socketTypeHash === 1282012138) {
        // This is a kill tracker slot, ignore it
        continue
      }

      let socket = {
        id: i,
        curatedPlugIds: [],
        randomPlugIds: []
      }
      for (let plugEntry of socketEntry.reusablePlugItems) {
        socket.curatedPlugIds.push(plugEntry.plugItemHash)
        curatedPlugIds.add(plugEntry.plugItemHash)
      }

      if (socketEntry.randomizedPlugItems.length > 0) {
        rolls.fixedRoll = false
      }
      for (let plugEntry of socketEntry.randomizedPlugItems) {
        socket.randomPlugIds.push(plugEntry.plugItemHash)
        randomPlugIds.add(plugEntry.plugItemHash)
      }
      rolls.sockets.push(socket)
    }

    rolls.curatedPlugIds = curatedPlugIds
    if (!rolls.fixedRoll) {
      rolls.curatedOnlyPlugIds = setDifference(curatedPlugIds, randomPlugIds)
    } else {
      rolls.curatedOnlyPlugIds = new Set()
    }
    rolls.randomPlugIds = randomPlugIds

    return rolls
  }

  hasTier(...tiers) {
    return _.includes(tiers, this.tier)
  }

  hasType(...types) {
    return _.includes(types, this.type)
  }

  hasIntrinsicPlug(...plugIds) {
    return _.includes(plugIds, this.rolls.intrinsicPlugId)
  }

  hasDamageType(...damageTypes) {
    return _.includes(damageTypes, this.damageType)
  }

  isInBucket(...buckets) {
    return _.includes(buckets, this.bucket)
  }

  canHaveAllPlugs(...plugSpecs) {
    return this.curatedRollCanHaveAllPlugs(...plugSpecs) ||
      this.randomRollCanHaveAllPlugs(...plugSpecs)
  }

  randomRollCanHaveAllPlugs(...plugSpecs) {
    let usedSockets = new Set()
    let potentialSockets = []
    for(let plugSpec of plugSpecs) {
      if(_.isNumber(plugSpec)) {
        let socketId = this.findSocketIdForRandomPlug(plugSpec)
        if(_.isUndefined(socketId) || usedSockets.has(socketId)) {
          return false
        } else {
          usedSockets.add(socketId)
        }
      } else if (_.isArray(plugSpec)) {
        let socketIds = this.findSocketIdsForRandomPlugs(...plugSpec)
        if(_.isEmpty(socketIds)) {
          return false
        } else if (socketIds.length === 1) {
          let socketId = socketIds[0]
          if(usedSockets.has(socketId)) {
            return false
          } else {
            usedSockets.add(socketId)
          }
        } else {
          potentialSockets.push(socketIds)
        }
      }
    }

    return hasValidConfiguration(usedSockets, ...potentialSockets)
  }

  curatedRollCanHaveAllPlugs(...plugSpecs) {
    let usedSockets = new Set()
    let potentialSockets = []
    for(let plugSpec of plugSpecs) {
      if(_.isNumber(plugSpec)) {
        let socketId = this.findSocketIdForCuratedPlug(plugSpec)
        if(_.isUndefined(socketId) || usedSockets.has(socketId)) {
          return false
        } else {
          usedSockets.add(socketId)
        }
      } else if (_.isArray(plugSpec)) {
        let socketIds = this.findSocketIdsForCuratedPlugs(...plugSpec)
        if(_.isEmpty(socketIds)) {
          return false
        } else if (socketIds.length === 1) {
          let socketId = socketIds[0]
          if(usedSockets.has(socketId)) {
            return false
          } else {
            usedSockets.add(socketId)
          }
        } else {
          potentialSockets.push(socketIds)
        }
      }
    }

    return hasValidConfiguration(usedSockets, ...potentialSockets)
  }

  findSocketIdForRandomPlug(plugId) {
    for(let socket of this.rolls.sockets) {
      if(_.includes(socket.randomPlugIds, plugId)) {
        return socket.id
      }
    }
    return undefined
  }

  findSocketIdsForRandomPlugs(...plugIds) {
    let socketIds = []
    for(let socket of this.rolls.sockets) {
      for(let plugId of plugIds) {
        if (_.includes(socket.randomPlugIds, plugId)) {
          socketIds.push(socket.id)
        }
      }
    }
    return new Set(socketIds)
  }

  findSocketIdForCuratedPlug(plugId) {
    for(let socket of this.rolls.sockets) {
      if(_.includes(socket.curatedPlugIds, plugId)) {
        return socket.id
      }
    }
    return undefined
  }

  findSocketIdsForCuratedPlugs(...plugIds) {
    let socketIds = []
    for(let socket of this.rolls.sockets) {
      for(let plugId of plugIds) {
        if (_.includes(socket.curatedPlugIds, plugId)) {
          socketIds.push(socket.id)
        }
      }
    }
    return socketIds
  }

  toPrintable (includeRawJson) {
    let printable = {
      ...this
    }
    printable.rolls.curatedPlugIds = [...printable.rolls.curatedPlugIds]
    printable.rolls.curatedOnlyPlugIds = [...printable.rolls.curatedOnlyPlugIds]
    printable.rolls.randomPlugIds = [...printable.rolls.randomPlugIds]
    if (_.isUndefined(includeRawJson) || !includeRawJson) {
      delete printable.rawJson
    }
    return printable
  }
}

function parseDamageType (damageTypeId) {
  switch (damageTypeId) {
    case 1:
      return 'Kinetic'
    case 2:
      return 'Arc'
    case 3:
      return 'Solar'
    case 4:
      return 'Void'
    default:
      return undefined
  }
}

function parseBucket (bucketId) {
  switch (bucketId) {
    case 1498876634:
      return 'Kinetic'
    case 2465295065:
      return 'Energy'
    case 953998645:
      return 'Power'
    default:
      return undefined
  }
}

function hasValidConfiguration(usedSockets, ...potentialSocketSets) {
  if(_.isEmpty(potentialSocketSets)) {
    return true
  }

  let nextSocketSet = _.head(potentialSocketSets)
  let otherSocketSets = _.tail(potentialSocketSets)
  for (let socketId of nextSocketSet) {
    if (usedSockets.has(socketId)) {
      continue
    }

    let usedSocketsClone = new Set([socketId, ...usedSockets])
    if (hasValidConfiguration(usedSocketsClone, ...otherSocketSets)) {
      return true
    }
  }
  return false
}

function setDifference (set, ...iterables) {
  const setCopy = new Set(set)

  for (let iterable of iterables) {
    for (let item of iterable) {
      setCopy.delete(item)
    }
  }

  return setCopy
}

module.exports = Weapon
