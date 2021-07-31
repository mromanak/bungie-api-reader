import _ from 'lodash'
import {DestinyPlugSetDefinition} from "./destinyManifestDefinitions";
import {DbEntry} from "./utilityInterfaces";

class PlugSet implements DbEntry {
    constructor(
        public id: number,
        public index: number,
        public plugIds: Set<number>
    ) {
    }

    static fromManifestDefinition(def: DestinyPlugSetDefinition) {
        return new PlugSet(
            def.hash,
            def.index,
            new Set(_.chain(def.reusablePlugItems).
                filter((plugItem) => plugItem.currentlyCanRoll).
                map((plugItem) => plugItem.plugItemHash).
                value()
            )
        )
    }
}

export default PlugSet
