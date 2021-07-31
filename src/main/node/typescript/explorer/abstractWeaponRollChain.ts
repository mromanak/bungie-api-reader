import WeaponRoll from "../model/weaponRoll";
import AbstractWeaponChain from "./abstractWeaponChain";

abstract class AbstractWeaponRollChain<T extends WeaponRoll> extends AbstractWeaponChain<T> {
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
