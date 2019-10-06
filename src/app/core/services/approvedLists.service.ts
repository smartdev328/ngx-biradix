import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {IProperty, IPropertySearchCriteria} from "../models/property";
import {SiteService} from "./site.service";
import {IAmenity, IAmenitySearchCriteria} from "../models/amenities";
import {
  APPROVED_LIST_TYPE,
  IApprovedListItemRead, IApprovedListItemWrite,
  IApprovedListSearchCriteria, IUnapprovedListFrequenciesWithProperties, IUnapprovedListFrequency
} from "../models/approvedLists";

@Injectable()
export class ApprovedListsService {
  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }

  async getUnapprovedFrequencyWithProperties (type: APPROVED_LIST_TYPE) : Promise<IUnapprovedListFrequenciesWithProperties> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `query {
        UnapprovedList(type: ${type}) {
          frequency {value count}
          unapproved {id name value}
          }
        }
       `
    };
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/graphql?bust=" + (new Date()).getTime(), gql, {headers: authHeader}).toPromise();
      return {frequencies: searchResponse.data.UnapprovedList.frequency, properties: searchResponse.data.UnapprovedList.unapproved};
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }

  async getUnapprovedFrequency (type: APPROVED_LIST_TYPE) : Promise<IUnapprovedListFrequency[]> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `query {
        UnapprovedList(type: ${type}) {
          frequency {value count}
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

  async searchApproved (criteria: IApprovedListSearchCriteria) : Promise<IApprovedListItemRead[]> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `query Approved($criteria: ApprovedListSearchCriteria) {
          ApprovedList(criteria: $criteria) {
            id
            value
            type
            searchable
          }
        }`,
      variables: {"criteria": criteria},
    };
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/graphql?bust=" + (new Date()).getTime(), gql, {headers: authHeader}).toPromise();
      return searchResponse.data.ApprovedList;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }

  async deleteApproved (type: APPROVED_LIST_TYPE, value: string) : Promise<IApprovedListItemRead> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `mutation ApprovedListItemDelete($value: String, $type: ApprovedListType) {
        ApprovedListItemDelete(value: $value, type: $type) {
            id
            value
            type
            searchable
          }
      }`,
      variables: {value, type},
    };
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/graphql?bust=" + (new Date()).getTime(), gql, {headers: authHeader}).toPromise();
      return searchResponse.data.ApprovedListItemDelete;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }

  async createApproved (approvedListItem: IApprovedListItemWrite) : Promise<IApprovedListItemRead> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    const gql = {
      query: `mutation ApprovedListItemCreate($approvedListItem: ApprovedListItemWrite) {
        ApprovedListItemCreate(approvedListItem: $approvedListItem) {
            id
            value
            type
            searchable
          }
      }`,
      variables: {approvedListItem},
    };
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/graphql?bust=" + (new Date()).getTime(), gql, {headers: authHeader}).toPromise();
      return searchResponse.data.ApprovedListItemCreate;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }
}
