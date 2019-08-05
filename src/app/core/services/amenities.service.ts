import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {IProperty, IPropertySearchCriteria} from "../models/property";
import {SiteService} from "./site.service";
import {IAmenity, IAmenitySearchCriteria} from "../models/amenities";

@Injectable()
export class AmenitiesService {
  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }
  async search (criteria: IAmenitySearchCriteria) : Promise<IAmenity[]> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();
    try {
      const searchResponse: any = await this.http.post(apiUrl + "/api/1.0/amenities?bust=" + (new Date()).getTime(), criteria, {headers: authHeader}).toPromise();
      return searchResponse.amenities;
    } catch(err) {
      this.siteService.handleApiError();
      return null;
    }
  }
}
