import WeaponRoll from "../model/weaponRoll";
import AbstractWeaponChain from "./abstractWeaponChain";

abstract class AbstractWeaponRollChain<T extends WeaponRoll> extends AbstractWeaponChain<T> {

    withDisplayStatLt(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.weaponRollWithDisplayStatLtPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withDisplayStatLte(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.weaponRollWithDisplayStatLtePredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withDisplayStatEq(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.weaponRollWithDisplayStatEqPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withDisplayStatGte(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.weaponRollWithDisplayStatGtePredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withDisplayStatGt(nameOrId: string | number, value: number): this {
        let predicate = this.itemExplorer.weaponRollWithDisplayStatGtPredicate(nameOrId, value)
        this.chain = this.chain.filter(predicate)
        return this
    }
    
    excludingFixedRolls(): this {
        this.chain = this.chain.filter((roll) => roll.perkBlock.isRandomRoll)
        return this
    }

    excludingRandomizedRolls(): this {
        this.chain = this.chain.filter((roll) => !roll.perkBlock.isRandomRoll)
        return this
    }

    withPerk(nameOrId: string | number): this {
        let predicate = this.itemExplorer.weaponRollWithPerkPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withPerkIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.weaponRollWithPerkInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutPerk(nameOrId: string | number): this {
        let predicate = this.itemExplorer.weaponRollWithoutPerkPredicate(nameOrId)
        this.chain = this.chain.filter(predicate)
        return this
    }

    withoutPerkIn(...namesOrIds: (string | number)[]): this {
        let predicate = this.itemExplorer.weaponRollWithoutPerkInPredicate(...namesOrIds)
        this.chain = this.chain.filter(predicate)
        return this
    }
}

export default AbstractWeaponRollChain
