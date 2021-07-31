import _ from 'lodash'
import ItemExplorer from "./itemExplorer";
import InventoryItem from "../model/inventoryItem";
import AbstractWeaponChain from "./abstractWeaponChain";

class WeaponChain extends AbstractWeaponChain<InventoryItem>{
    constructor(
        itemExplorer: ItemExplorer
    ) {
        super (
            itemExplorer,
            _.chain(_.values(itemExplorer.idToWeaponMap))
        )
    }
}

export default WeaponChain
