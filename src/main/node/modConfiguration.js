const _ = require('lodash')
const StatBlock = require('./statBlock')

class ModConfiguration {
  constructor(mods) {
    this.mods = mods
    this.modContributions = {}
    this.statBlock = new StatBlock()
    _.each(mods, (mod) => {
      this.statBlock = this.statBlock.merge(mod.statBlock)
      let statIds = _.keys(mod.statBlock.getRawStatMap())
      _.each(statIds, (statId) => {
        if(_.has(this.modContributions, statId)) {
          this.modContributions[statId].push(mod.name)
        } else {
          this.modContributions[statId] = [mod.name]
        }
      })
    })
  }
}

module.exports = ModConfiguration
