export enum ApprovedListType {
    MANAGER = "Manager",
    OWNER = "Owner",
}

export interface IApprovedListItemWrite {
    value: string;
    type: ApprovedListType;
}

export interface IApprovedListItemRead extends IApprovedListItemWrite {
    id: string;
    active: boolean;
    aliases: string[];
}
