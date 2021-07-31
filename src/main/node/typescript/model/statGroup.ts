import _ from 'lodash'
import {DbEntry} from "./utilityInterfaces";
import {DestinyStatDisplayDefinition, DestinyStatGroupDefinition} from "./destinyManifestDefinitions";

function clamp(inputValue: number, lowerBound: number, upperBound: number): number {
    return Math.max(Math.min(inputValue, upperBound), lowerBound)
}

// Taken from bankers-rounding on npm, since TypeScript was not playing nice with impo it
// TODO Figure out how to properly import this
function round(num: number, decimalPlaces?: number): number {
    let d = decimalPlaces || 0;
    let m = Math.pow(10, d);
    let n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
    let i = Math.floor(n), f = n - i;
    let e = 1e-8; // Allow for rounding errors in f
    let r = (f > 0.5 - e && f < 0.5 + e) ?
        ((i % 2 == 0) ? i : i + 1) :
        Math.round(n);

    return d ? r / m : r;
}

class StatGroup implements DbEntry {
    constructor(
        public id: number,
        public index: number,
        public maximumValue: number,
        public statIdToInterpolationTables: { [key: number]: InterpolationTable }
    ) {
    }

    static fromManifestDefinition(def: DestinyStatGroupDefinition) {
        let statIdToInterpolationTables: { [key: number]: InterpolationTable } = {}
        for (let scaledStat of def.scaledStats) {
            statIdToInterpolationTables[scaledStat.statHash] = InterpolationTable.fromManifestDefinition(scaledStat)
        }

        return new StatGroup(
            def.hash,
            def.index,
            def.maximumValue,
            statIdToInterpolationTables
        )
    }

    interpolate(statId: number, inputValue: number): number {
        if (!this.statIdToInterpolationTables[statId]) {
            // console.log(`DEBUG -- No stat with ID ${statId}: input: ${inputValue}; output: ${clamp(inputValue, 0, this.maximumValue)}`)
            return clamp(inputValue, 0, this.maximumValue)
        }

        let statValue = this.statIdToInterpolationTables[statId].interpolate(inputValue)
        // console.log(`DEBUG -- Yes stat with ID ${statId}: input: ${inputValue}; output: ${statValue}; table: ${JSON.stringify(this.statIdToInterpolationTables[statId])}`)
        return statValue
    }
}

class InterpolationTable {
    constructor(
        public maximumValue: number,
        public points: InterpolationPoint[]
    ) {
    }

    static fromManifestDefinition(def: DestinyStatDisplayDefinition) {
        return new InterpolationTable(
            def.maximumValue,
            _.map(def.displayInterpolation, (point) => {
                return new InterpolationPoint(
                    point.value,
                    point.weight
                )
            })
        )
    }

    interpolate(inputValue: number): number {
        inputValue = clamp(inputValue, 0, this.maximumValue)
        let lowerPoint: InterpolationPoint | undefined = undefined
        let upperPoint: InterpolationPoint | undefined = undefined

        for (let point of this.points) {
            if (point.inputValue == inputValue) {
                return point.outputValue
            } else if (point.inputValue > inputValue) {
                upperPoint = point
                break
            } else {
                lowerPoint = point
            }
        }

        if (!upperPoint && lowerPoint) {
            return lowerPoint.outputValue
        } else if (upperPoint && !lowerPoint) {
            return upperPoint.outputValue
        } else if (upperPoint && lowerPoint) {
            // Assume all input and output values are integers so we only have to round once
            return lowerPoint.outputValue + round((upperPoint.outputValue - lowerPoint.outputValue) *
                    (inputValue - lowerPoint.inputValue) / (upperPoint.inputValue - lowerPoint.inputValue))
        } else {
            throw new Error('Interpolation table was empty')
        }
    }
}

class InterpolationPoint {
    constructor(
        public inputValue: number,
        public outputValue: number
    ) {
    }
}

export default StatGroup
