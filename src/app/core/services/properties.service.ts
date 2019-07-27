import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {IProperty, IPropertySearchCriteria} from "../models/property";
import {SiteService} from "./site.service";

@Injectable()
export class PropertyService {
  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }
  async search (criteria: IPropertySearchCriteria) : Promise<IProperty[]> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/api/1.0/properties?bust=" + (new Date()).getTime(), criteria, {headers: authHeader}).toPromise();
      return searchResponse.properties;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }
}
