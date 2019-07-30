import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {SiteService} from "./site.service";
import {IHistoryResponse, IHistorySearchCriteria} from "../models/history";

@Injectable()
export class HistoryService {
  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }
  async search (criteria: IHistorySearchCriteria) : Promise<IHistoryResponse> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/api/1.0/audit?bust=" + (new Date()).getTime(), criteria, {headers: authHeader}).toPromise();
      return searchResponse;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }
}
