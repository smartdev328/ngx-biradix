export interface IPropertySearchRequest {
    limit: number;
    active?: boolean;
    geo?: {
        loc: [number, number];
        distance: number;
    };
    select: string;
    exclude?: string[];
    hideCustom?: boolean;
    searchName?: string;
}
