const _ = require('lodash')
const round = require('bankers-rounding')

class StatGroup {

  constructor (rawJson) {
    this.rawJson = rawJson
    this.id = rawJson.hash
    this.interpolationTables = parseInterpolationTables(rawJson.scaledStats)
  }

  static parse (json) {
    if (typeof json === 'string') {
      return new StatGroup(JSON.parse(json))
    } else if (typeof json === 'object') {
      return new StatGroup(json)
    } else {
      throw new Error(
        `Unexpected type for json parameter. Expected string or object, but got ${typeof json}`)
    }
  }

  interpolate (statId, rawValue) {
    if (_.isUndefined(this.interpolationTables[statId])) {
      return rawValue
    }

    let interpolationTable = this.interpolationTables[statId].interpolationTable
    let maximumRawValue = this.interpolationTables[statId].maximumValue
    if(rawValue > maximumRawValue) {
      rawValue = maximumRawValue
    }
    let lowerEntry, upperEntry

    // Assume interpolationTable is already sorted by value (ascending)
    for (let i = 0; i < interpolationTable.length; i++) {
      let entry = interpolationTable[i]
      if (entry.value === rawValue) {
        return entry.weight
      } else if (entry.value > rawValue) {
        upperEntry = entry
        break
      } else {
        lowerEntry = entry
      }
    }

    let displayValue
    if (!upperEntry) {
      displayValue = lowerEntry.weight
    } else if (!lowerEntry) {
      displayValue = upperEntry.weight
    } else {
      // Assume all weights and values are integers so we only have to round once
      displayValue =
        lowerEntry.weight + round((upperEntry.weight - lowerEntry.weight) *
        (rawValue - lowerEntry.value) / (upperEntry.value - lowerEntry.value))
    }
    return displayValue
  }

  toPrintable (includeRawJson) {
    let printable = {
      ...this
    }
    if (_.isUndefined(includeRawJson) || !includeRawJson) {
      delete printable.rawJson
    }
    return printable
  }
}

function parseInterpolationTables (scaledStats) {
  let interpolationTables = {}
  _.each(scaledStats, (scaledStat) => {
    interpolationTables[scaledStat.statHash] = {
      statDefinitionId: scaledStat.statHash,
      maximumValue: scaledStat.maximumValue,
      interpolationTable: scaledStat.displayInterpolation
    }
  })
  return interpolationTables
}

module.exports = StatGroup
