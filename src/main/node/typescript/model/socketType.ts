import _ from 'lodash'
import {DestinySocketTypeDefinition} from "./destinyManifestDefinitions";
import {DbEntry} from "./utilityInterfaces";

class SocketType implements DbEntry {
    constructor(
        public id: number,
        public index: number,
        public allowableCategories: Set<string>
    ) {
    }

    static fromManifestDefinition(def: DestinySocketTypeDefinition) {
        return new SocketType(
            def.hash,
            def.index,
            new Set(_.map(def.plugWhitelist, (entry) => {
                return entry.categoryIdentifier
            }))
        )
    }
}

export default SocketType
