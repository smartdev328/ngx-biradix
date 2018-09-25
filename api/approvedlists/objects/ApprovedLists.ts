export enum ApprovedListType {
    MANAGER = "Manager",
    OWNER = "Owner",
}

export interface IApprovedListItemWrite {
    value: string;
    type: ApprovedListType;
    searchable: boolean;
}

export interface IApprovedListItemRead extends IApprovedListItemWrite {
    id: string;
    aliases: string[];
}
