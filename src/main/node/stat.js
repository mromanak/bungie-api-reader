const _ = require('lodash')

class Stat {

  constructor (rawJson) {
    this.rawJson = rawJson
    this.id = rawJson.hash
    this.name = rawJson.displayProperties.name
    this.description = rawJson.displayProperties.description
  }

  static parse (json) {
    if (typeof json === 'string') {
      return new Stat(JSON.parse(json))
    } else if (typeof json === 'object') {
      return new Stat(json)
    } else {
      throw new Error(`Unexpected type for json parameter. Expected string or object, but got ${typeof json}`)
    }
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

module.exports = Stat