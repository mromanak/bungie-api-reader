import {DestinyDamageTypeDefinition} from "./destinyManifestDefinitions";
import {NamedDbEntry} from "./utilityInterfaces";

class DamageType implements NamedDbEntry {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public index: number,
        public enumValue: number
    ) {
    }

    static fromManifestDefinition(def: DestinyDamageTypeDefinition) {
        return new DamageType(
            def.hash,
            def.displayProperties.name,
            def.displayProperties.description,
            def.index,
            def.enumValue
        )
    }
}

export default DamageType
