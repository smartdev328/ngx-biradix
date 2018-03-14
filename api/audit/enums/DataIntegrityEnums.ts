export enum DataIntegritySeverity {
    HIGH = 1,
    MEDIUM = 2,
    LOW = 3,
}

export enum DataIntegritySearchParameter {
    PROPERTY = "Property",
    USER = "User",
}

export enum DataIntegrityCheckType {
    PROPERTY_GEO_DUPLICATE = "PROPERTY_GEO_DUPLICATE",
    PROPERTY_NAME_DUPLICATE = "PROPERTY_NAME_DUPLICATE",
    PROPERTY_ADDRESS_CHANGE = "PROPERTY_ADDRESS_CHANGE",
    PROPERTY_FLOOR_PLANS_CHANGE = "PROPERTY_FLOOR_PLANS_CHANGE",
    USER_NAME_CHANGED = "USER_NAME_CHANGED",
    USER_NAME_EMAIL_CHANGED = "USER_NAME_EMAIL_CHANGED",
}
