import AbstractWeaponRollChain from "./abstractWeaponRollChain";
import WeaponRoll from "../model/weaponRoll";
import WeaponChain from "./weaponChain";

class WeaponRollChain extends AbstractWeaponRollChain<WeaponRoll> {
    constructor(
        weaponChain: WeaponChain
    ) {
        super(
            weaponChain.itemExplorer,
            weaponChain.chain.flatMap((weapon) => [...weaponChain.itemExplorer.generateWeaponRolls(weapon)])
        );
    }
}

export default WeaponRollChain
