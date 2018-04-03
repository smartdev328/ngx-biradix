import {IPaginatedSearchResponse, ISearchResponse} from "./ISearchResponse";

export class SearchResponse<T> implements ISearchResponse<T> {
    public data: T;
}
