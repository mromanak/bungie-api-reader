import {DbEntry} from "./utilityInterfaces";
import {DestinyPowerCapDefinition} from "./destinyManifestDefinitions";

class PowerCap implements DbEntry {
    constructor(
        public id: number,
        public index: number,
        public value: number
    ) {
    }

    static fromManifestDefinition(def: DestinyPowerCapDefinition) {
        return new PowerCap(
            def.hash,
            def.index,
            def.powerCap
        )
    }
}

export default PowerCap
