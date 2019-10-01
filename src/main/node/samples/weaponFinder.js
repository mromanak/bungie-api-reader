const _ = require('lodash')
const ApiContext = require('../apiContext')
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier
const WeaponChain = require('../weaponChain')

const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: '/Users/mromanak13/Downloads/bungie/bungie/current'
  }
})
const context = new ApiContext(knex)
const inverseRegex = /^inv:(.*)/

let relevantStats = ['Range', 'Stability', 'Aim Assistance']
let displayStats = _.map(relevantStats, (statName) => {
  if (inverseRegex.test(statName)) {
    statName = inverseRegex.exec(statName)[1]
  }
  return statName
})
let calculatedStats = [
  // namedCustomStat('Geo. Mean', geometricMeanOf(...relevantStats)),
  namedCustomStat('Mods', modsContributing(...relevantStats))
]
const csvStringifier = createCsvStringifier({
  header: [
    {id: 'id', title: 'ID'},
    {id: 'name', title: 'Name'},
    {id: 'rarity', title: 'Rarity'},
    {id: 'rollType', title: 'Roll Type'},
    {id: 'type', title: 'Type'},
    {id: 'detailedArchetype', title: 'Archetype'},
    {id: 'damageType', title: 'Damage Type'},
    ..._.map(calculatedStats, (stat) => {return {id: stat.name, title: stat.name}}),
    ..._.map(displayStats, (statName) => {return {id: statName, title: statName}})
  ]
})

context.ready().
  then(() => {
    let obj = new WeaponChain(context, context.getAllWeapons()).
      withStats(...displayStats).
      withRarities('Legendary').
      sortedBy([
        geometricMeanSort(...relevantStats)
      ], 'desc').
      uniqueByWeaponId().
      addRawDisplayStats('Rounds Per Minute', 'Charge Time', 'Impact').
      sortedBy([
        (config) => config.weapon.type,
        (config) => config.rawStats['Rounds Per Minute'],
        (config) => config.rawStats['Impact'],
        detailedArchetypeSort,
        (config) => config.weapon.damageTypeId
      ], 'asc', 'asc', 'desc', 'asc', 'asc').
      map(configToCsvPrintable(...calculatedStats)).
      uniqBy((obj) => {
        let differentiators = [
          obj.bucket,
          obj.type,
          obj.rarity === 'Exotic' ? 'Exotic' : obj.archetypeId,
          obj['Raw Rounds Per Minute'],
          obj['Raw Impact'],
          obj.damageType
        ]
        return differentiators.join('/')
      }).
      values()

    console.log(csvStringifier.getHeaderString().trim())
    console.log(csvStringifier.stringifyRecords(obj))
  }).
  catch((err) => console.error(err.stack)).
  finally(() => knex.destroy())

function configToCsvPrintable (...customStats) {
  return function (config) {
    let csvPrintable = {
      name: config.weaponName,
      id: config.weaponId,
      bucket: config.weapon.bucket,
      rarity: config.weapon.tier,
      rollType: config.isCurated ? 'Fixed' : 'Random',
      type: config.weapon.type,
      archetypeId: config.weapon.rolls.intrinsicPlugId,
      archetype: archetypeForConfig(config),
      detailedArchetype: detailedArchetypeForConfig(config),
      damageType: config.weapon.damageType
    }

    _.each(config.displayStats, (statValue, statName) => {
      csvPrintable[statName] = statValue
    })

    _.each(config.rawStats, (statValue, statName) => {
      csvPrintable[`Raw ${statName}`] = statValue
    })

    _.each(customStats, (customStat) => {
      csvPrintable[customStat.name] = customStat.valueFunction(config)
    })

    return csvPrintable
  }
}

function archetypeForConfig (config) {
  if (config.weapon.tier === 'Exotic') {
    return 'Exotic'
  }
  return context.getModById(config.weapon.rolls.intrinsicPlugId).name
}

function detailedArchetypeForConfig (config) {
  let baseName = archetypeForConfig(config)

  if (_.has(config, 'rawStats') && _.has(config.rawStats, 'Rounds Per Minute')  && config.rawStats['Rounds Per Minute'] !== 0) {
    return `${baseName} (${config.rawStats['Rounds Per Minute']} RPM)`
  } else if (_.has(config.displayStats, 'Rounds Per Minute')  && config.displayStats['Rounds Per Minute'] !== 0) {
    return `${baseName} (${config.displayStats['Rounds Per Minute']} RPM)`
  }
  
  if (_.has(config, 'rawStats') && _.has(config.rawStats, 'Charge Time')  && config.rawStats['Charge Time'] !== 0) {
    return `${baseName} (${config.rawStats['Charge Time']} ms)`
  } else if (_.has(config.displayStats, 'Charge TIme')  && config.displayStats['Charge TIme'] !== 0) {
    return `${baseName} (${config.displayStats['Charge TIme']} ms)`
  }
  
  if (_.has(config, 'rawStats') && _.has(config.rawStats, 'Draw Time')  && config.rawStats['Draw Time'] !== 0) {
    return `${baseName} (${config.rawStats['Draw Time']} ms)`
  } else if (_.has(config.displayStats, 'Draw TIme')  && config.displayStats['Draw TIme'] !== 0) {
    return `${baseName} (${config.displayStats['Draw TIme']} ms)`
  }

  return baseName
}

function detailedArchetypeSort (config) {
  let detailedArchetype = detailedArchetypeForConfig(config)
  if (/^Exotic/.test(detailedArchetype)) {
    return `ZZZ${detailedArchetype}`
  }
  return `${detailedArchetype}/${config.weapon.rolls.intrinsicPlugId}`
}

function geometricMeanOf (...statNames) {
  return function (config) {
    let product = 1
    for (let statName of statNames) {
      let inverse = false
      if (inverseRegex.test(statName)) {
        inverse = true
        statName = inverseRegex.exec(statName)[1]
      }

      if (!_.has(config.displayStats, statName)) {
        throw new Error(
          `${config.weaponName} (${config.weaponId}) does not have a stat named ${statName}. Available stat names are: ${_.keys(
            config.displayStats).join(', ')}.`)
      }

      if (inverse) {
        product /= config.displayStats[statName]
      } else {
        product *= config.displayStats[statName]
      }
    }
    return product ** (1 / statNames.length)
  }
}

function geometricMeanOfStats (config, ...statNames) {
  return geometricMeanOf(...statNames)(config)
}

function geometricMeanSort (...statNames) {
  return function (config) {
    return geometricMeanOfStats(config, ...statNames)
  }
}

function modsContributing (...statNames) {
  return function (config) {
    let contributingModLists = []
    for (let statName of statNames) {
      if (inverseRegex.test(statName)) {
        statName = inverseRegex.exec(statName)[1]
      }

      if (_.has(config.modContributions, statName)) {
        contributingModLists.push(config.modContributions[statName])
      }
    }

    if (_.isEmpty(contributingModLists)) {
      return '-'
    }
    return _.union(...contributingModLists).join('/')
  }
}

function namedCustomStat (name, valueFunction) {
  return {
    name,
    valueFunction
  }
}
