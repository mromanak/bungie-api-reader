const _ = require('lodash')

class PlugSet {

  constructor (rawJson) {
    this.rawJson = rawJson
    this.id = rawJson.hash
    this.reusablePlugItems = rawJson.reusablePlugItems
  }

  static parse (json) {
    if (typeof json === 'string') {
      return new PlugSet(JSON.parse(json))
    } else if (typeof json === 'object') {
      return new PlugSet(json)
    } else {
      throw new Error(
        `Unexpected type for json parameter. Expected string or object, but got ${typeof json}`)
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

module.exports = PlugSet
