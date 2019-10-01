const _ = require('lodash')

class StatBlock {
  constructor () {
    this.stats = {}
  }

  hasStat(statId) {
    return _.has(this.stats, statId)
  }

  addStat (statId, value) {
    if (_.has(this.stats, statId)) {
      this.stats[statId] += value
    } else {
      this.stats[statId] = value
    }
  }

  getRawStat (statId) {
    if (_.has(this.stats, statId)) {
      return this.stats[statId]
    } else {
      return 0
    }
  }

  getDisplayStat (statId, statGroup) {
    return statGroup.interpolate(statId, this.getRawStat(statId))
  }

  getRawStatMap () {
    return {...this.stats}
  }

  getDisplayStatMap (statGroup) {
    return _.mapValues(this.stats, (rawValue, statId) => {
      return statGroup.interpolate(statId, rawValue)
    })
  }

  merge (other) {
    if(_.isUndefined(other)) {
      return this.merge(new StatBlock())
    }

    let thisStatIds = _.keys(this.stats)
    let otherStatIds = _.keys(other.stats)
    let mergedStatIds = new Set([...thisStatIds, ...otherStatIds])
    let mergedStatBlock = new StatBlock()
    for (let statId of mergedStatIds) {
      mergedStatBlock.addStat(statId, this.getRawStat(statId))
      mergedStatBlock.addStat(statId, other.getRawStat(statId))
    }
    return mergedStatBlock
  }
}

module.exports = StatBlock
