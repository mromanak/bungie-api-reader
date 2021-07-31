import {DestinyItemCategoryDefinition} from "./destinyManifestDefinitions";
import {NamedDbEntry} from "./utilityInterfaces";

class ItemCategory implements NamedDbEntry {
    constructor(
        public id: number,
        public name: string,
        public description: string,
        public index: number
    ) {
    }

    static fromManifestDefinition(def: DestinyItemCategoryDefinition) {
        return new ItemCategory(
            def.hash,
            def.displayProperties.name,
            def.displayProperties.description,
            def.index
        )
    }
}

export default ItemCategory
