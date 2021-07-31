interface DestinyDamageTypeDefinition extends DestinyNamedManifestDefinition {
    enumValue: number
}

interface DestinyDisplayPropertiesDefinition {
    description: string
    name: string
}

interface DestinyItemInventoryBlockDefinition {
    tierType: DestinyItemInventoryBlockRarity
}

enum DestinyItemInventoryBlockRarity {
    UNKNOWN = 0,
    CURRENCY = 1,
    BASIC = 2,
    COMMON = 3,
    RARE = 4,
    LEGENDARY = 5,
    EXOTIC = 6
}

interface DestinyInventoryItemDefinition extends DestinyNamedManifestDefinition {
    itemTypeDisplayName: string,
    flavorText: string
    itemTypeAndTierDisplayName: string
    inventory: DestinyItemInventoryBlockDefinition
    stats?: DestinyItemStatBlockDefinition
    quality?: DestinyItemQualityBlockDefinition
    plug?: DestinyItemPlugDefinition
    sockets?: DestinyItemSocketBlockDefinition
    investmentStats?: DestinyItemInvestmentStatDefinition[]
    itemCategoryHashes: number[]
    itemType: DestinyInventoryItemType
    defaultDamageTypeHash?: number
    traitIds: string[]
}

enum DestinyInventoryItemType {
    NONE = 0,
    CURRENCY = 1,
    ARMOR = 2,
    WEAPON = 3,
    MESSAGE = 7,
    ENGRAM = 8,
    CONSUMABLE = 9,
    EXCHANGE_MATERIAL = 10,
    MISSION_REWARD = 11,
    QUEST_STEP = 12,
    QUEST_STEP_COMPLETE = 13,
    EMBLEM = 14,
    QUEST = 15,
    SUBCLASS = 16,
    CLAN_BANNER = 17,
    AURA = 18,
    MOD = 19,
    DUMMY = 20,
    SHIP = 21,
    VEHICLE = 22,
    EMOTE = 23,
    GHOST = 24,
    PACKAGE = 25,
    BOUNTY = 26,
    WRAPPER = 27,
    SEASONAL_ARTIFACT = 28,
    FINISHER = 29
}

interface DestinyItemCategoryDefinition extends DestinyNamedManifestDefinition {
}

interface DestinyItemIntrinsicSocketEntryDefinition {
    plugItemHash: number
    socketTypeHash: number
}

interface DestinyItemInvestmentStatDefinition {
    statTypeHash: number
    value: number
}

// More a reminder that if this is defined, the item can be quickly identified as a plg than a useful interface
interface DestinyItemPlugDefinition {
}

interface DestinyItemSocketBlockDefinition {
    socketEntries: DestinyItemSocketEntryDefinition[]
    intrinsicSockets: DestinyItemIntrinsicSocketEntryDefinition[]
    socketCategories: DestinyItemSocketCategoryDefinition[]
}

interface DestinyItemSocketCategoryDefinition {
    socketCategoryHash: number
    socketIndexes: number[]
}

interface DestinyItemSocketEntryDefinition {
    socketTypeHash: number
    singleInitialItemHash: number
    reusablePlugItems?: DestinyItemSocketEntryPlugItemDefinition[]
    reusablePlugSetHash?: number
    randomizedPlugSetHash?: number
}

interface DestinyItemSocketEntryPlugItemDefinition {
    plugItemHash: number
}

interface DestinyItemSocketEntryPlugItemRandomizedDefinition extends DestinyItemSocketEntryPlugItemDefinition {
    currentlyCanRoll: boolean
}

interface DestinyItemStatBlockDefinition {
    statGroupHash: number
}

interface DestinyItemVersionDefinition {
    powerCapHash: number
}

interface DestinyManifestDefinition {
    hash: number
    index: number
}

interface DestinyNamedManifestDefinition extends DestinyManifestDefinition {
    displayProperties: DestinyDisplayPropertiesDefinition
}

interface DestinyPlugSetDefinition extends DestinyManifestDefinition {
    reusablePlugItems: DestinyItemSocketEntryPlugItemRandomizedDefinition[]
}

interface DestinyPlugWhitelistEntryDefinition {
    categoryIdentifier: string
}

interface DestinyPowerCapDefinition extends DestinyManifestDefinition {
    powerCap: number
}

interface DestinyItemQualityBlockDefinition {
    currentVersion: number
    versions: DestinyItemVersionDefinition[]
}

interface DestinySocketCategoryDefinition extends DestinyNamedManifestDefinition {
}

interface DestinySocketTypeDefinition extends DestinyManifestDefinition {
    plugWhitelist: DestinyPlugWhitelistEntryDefinition[]
}

interface DestinyStatDefinition extends DestinyNamedManifestDefinition {
}

interface DestinyStatDisplayDefinition {
    statHash: number
    maximumValue: number
    displayInterpolation: InterpolationPoint[]
}

interface DestinyStatGroupDefinition extends DestinyManifestDefinition {
    maximumValue: number
    scaledStats: DestinyStatDisplayDefinition[]
}

interface InterpolationPoint {
    value: number
    weight: number
}

export {
    DestinyDamageTypeDefinition,
    DestinyDisplayPropertiesDefinition,
    DestinyItemInventoryBlockDefinition,
    DestinyItemInventoryBlockRarity,
    DestinyInventoryItemDefinition,
    DestinyInventoryItemType,
    DestinyItemCategoryDefinition,
    DestinyItemIntrinsicSocketEntryDefinition,
    DestinyItemInvestmentStatDefinition,
    DestinyItemPlugDefinition,
    DestinyItemSocketBlockDefinition,
    DestinyItemSocketCategoryDefinition,
    DestinyItemSocketEntryDefinition,
    DestinyItemSocketEntryPlugItemDefinition,
    DestinyItemStatBlockDefinition,
    DestinyManifestDefinition,
    DestinyNamedManifestDefinition,
    DestinyPlugSetDefinition,
    DestinyPlugWhitelistEntryDefinition,
    DestinyPowerCapDefinition,
    DestinyItemQualityBlockDefinition,
    DestinySocketCategoryDefinition,
    DestinySocketTypeDefinition,
    DestinyStatDefinition,
    DestinyStatDisplayDefinition,
    DestinyStatGroupDefinition,
    InterpolationPoint
}
