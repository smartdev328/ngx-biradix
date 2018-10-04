export enum ApprovedListType {
    MANAGER = "MANAGER",
    OWNER = "OWNER",
}

export const ApprovedListTypeMap = {

};

ApprovedListTypeMap[ApprovedListType.MANAGER] = "Property:Management";
ApprovedListTypeMap[ApprovedListType.OWNER] = "Property:Owner";

export interface IApprovedListItemWrite {
    value: string;
    type: ApprovedListType;
    searchable: boolean;
}

export interface IApprovedListItemRead extends IApprovedListItemWrite {
    id: string;
    aliases: string[];
}
