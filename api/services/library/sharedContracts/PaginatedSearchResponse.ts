import {IPaginatedSearchResponse} from "./ISearchResponse";
import {SearchResponse} from "./SearchResponse";

export class PaginatedSearchResponse<T> extends SearchResponse<T> implements IPaginatedSearchResponse<T> {
    public totalRecords: number;
    public currentOffset: number;
    public currentPage: number;
    public pageSize: number;
}