import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {IProperty, IPropertySearchCriteria} from "../models/property";
import {SiteService} from "./site.service";
import {IAmenity, IAmenitySearchCriteria} from "../models/amenities";
import {APPROVED_LIST_TYPE, IUnapprovedListFrequency} from "../models/approvedLists";

@Injectable()
export class ApprovedListsService {
  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }
  async getUnapprovedFrequency (type: APPROVED_LIST_TYPE) : Promise<IUnapprovedListFrequency[]> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `query {
        UnapprovedList(type: ${type}) {
          frequency {value}
          }
        }
       `
    };
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/graphql?bust=" + (new Date()).getTime(), gql, {headers: authHeader}).toPromise();
      return searchResponse.data.UnapprovedList.frequency;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }
}
