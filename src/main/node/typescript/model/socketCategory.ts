import {DestinySocketCategoryDefinition} from "./destinyManifestDefinitions";
import {NamedDbEntry} from "./utilityInterfaces";

class SocketCategory implements NamedDbEntry {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public index: number
    ) {
    }

    static fromManifestDefinition(def: DestinySocketCategoryDefinition) {
        return new SocketCategory(
            def.hash,
            def.displayProperties.name,
            def.displayProperties.description,
            def.index
        )
    }
}

export default SocketCategory
