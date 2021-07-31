import {DestinyStatDefinition} from "./destinyManifestDefinitions";
import {NamedDbEntry} from "./utilityInterfaces";

class Stat implements NamedDbEntry {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public index: number
    ) {
    }

    static fromManifestDefinition(def: DestinyStatDefinition) {
        return new Stat(
            def.hash,
            def.displayProperties.name,
            def.displayProperties.description,
            def.index
        )
    }
}

export default Stat
