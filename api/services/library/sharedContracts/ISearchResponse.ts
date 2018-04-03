export interface ISearchResponse<T> {
    data: T;
}

export interface IPaginatedSearchResponse<T> extends ISearchResponse<T> {
    pageInfo: {
        totalRecords: number;
        currentOffset: number;
        currentPage: number;
        pageSize: number;
    };
}
