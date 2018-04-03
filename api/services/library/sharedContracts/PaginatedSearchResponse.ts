import {IPaginatedSearchResponse} from "./ISearchResponse";
import {SearchResponse} from "./SearchResponse";

export class PaginatedSearchResponse<T> extends SearchResponse<T> implements IPaginatedSearchResponse<T> {
    public pageInfo: {
        totalRecords: number;
        currentOffset: number;
        currentPage: number;
        pageSize: number;
    };
}