const _ = require('lodash')
const ApiContext = require('../apiContext')
const math = require('mathjs')

const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: '/Users/mromanak13/Downloads/bungie/bungie/current'
  }
})
const context = new ApiContext(knex)

context.ready().
  then(() => {
    let typeToArchetypeMap = {}
    _.chain(context.getAllWeapons()).
      filter((weapon) => weapon.hasTier('Legendary')).
      each((weapon) => {
        let type = weapon.type
        let archetypeId = weapon.rolls.intrinsicPlugId
        let archetype = context.getModById(archetypeId).name
        let statGroup = context.getStatGroupById(weapon.statGroupId)

        if (!_.has(typeToArchetypeMap, type)) {
          typeToArchetypeMap[type] = {}
        }
        let archetypeToStatsMap = typeToArchetypeMap[type]
        if (!_.has(archetypeToStatsMap, archetypeId)) {
          archetypeToStatsMap[archetypeId] = {
            name: archetype,
            constants: {},
            variables: {}
          }
        }
        let statMap = archetypeToStatsMap[archetypeId]
        _.each(weapon.statBlock.getRawStatMap(), (statValue, statId) => {
          let displayValue = statGroup.interpolate(statId, statValue)
          addStatValue(statMap, statId, displayValue)
        })
      }).
      value()
    _.each(typeToArchetypeMap, (archetypeMap) => {
      _.each(archetypeMap, (statMap) => {
        delete statMap.constants['Attack']
        delete statMap.constants['Power']
        delete statMap.constants['stat:1885944937']

        _.each(statMap.variables, (valueMap) => {
          let values = valueMap.values
          delete valueMap.values
          valueMap.maximum = math.max(...values)
          valueMap.minimum = math.min(...values)
          valueMap.mean = math.mean(...values)
          valueMap.standardDeviation = math.std(...values)
          valueMap.count = values.length
        })
      })
    })

    console.log(JSON.stringify(typeToArchetypeMap, null, 2))
  }).
  catch((err) => console.error(err.stack)).
  finally(() => knex.destroy())

function addStatValue (statMap, statId, statValue) {
  let statName = context.getStatById(statId).name
  statName = _.isEmpty(statName) ? `stat:${statId}` : statName
  if (_.has(statMap.variables, statName)) {
    statMap.variables[statName].values.push(statValue)
  } else if (_.has(statMap.constants, statName)) {
    let constantValue = statMap.constants[statName].value
    if (statValue === constantValue) {
      statMap.constants[statName].count += 1
    } else {
      let values = Array(statMap.constants[statName].count)
      _.fill(values, constantValue)
      values.push(statValue)
      delete statMap.constants[statName]
      statMap.variables[statName] = {
        values: values
      }
    }
  } else {
    statMap.constants[statName] = {
      value: statValue,
      count: 1
    }
  }
}