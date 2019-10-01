const _ = require('lodash')
const StatBlock = require('./statBlock')

class Mod {
  constructor (rawJson) {
    this.rawJson = rawJson
    this.id = rawJson.hash
    this.name = rawJson.displayProperties.name
    this.description = rawJson.displayProperties.description
    this.statBlock = this.parseStatBlock(rawJson.investmentStats)
  }

  static parse (json) {
    if (typeof json === 'string') {
      return new Mod(JSON.parse(json))
    } else if (typeof json === 'object') {
      return new Mod(json)
    } else {
      throw new Error(`Unexpected type for json parameter. Expected string or object, but got ${typeof json}`)
    }
  }

  parseStatBlock (investmentStats) {
    let statBlock = new StatBlock()
    _.each(investmentStats, (investmentStat) => {
      statBlock.addStat(investmentStat.statTypeHash, investmentStat.value)
    })
    return statBlock
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

module.exports = Mod