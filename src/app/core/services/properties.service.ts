import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {IProperty, IPropertySearchCriteria} from "../models/property";

@Injectable()
export class PropertyService {
  constructor(private http: HttpClient, private httpService: HttpService){
  }
  async search (criteria: IPropertySearchCriteria) : Promise<IProperty[]> {
    const apiUrl = this.httpService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();
    const searchResponse: any = await this.http.post(apiUrl + "/api/1.0/properties?bust=" + (new Date()).getTime(), criteria, {headers: authHeader}).toPromise();
    return searchResponse.properties;
  }
}
