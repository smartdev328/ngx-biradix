import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {ILoggedInUser, IloggedInUserWithToken} from "../models";
import {environment} from "../../../environments/environment";
import {IContact} from "../models/contact";
import {ILegacyResponse} from "../models/common";

@Injectable()
export class ContactService {
  constructor(private http: HttpClient, private httpService: HttpService){
  }

  async send(contact: IContact): Promise<ILegacyResponse> {
    const apiUrl = this.httpService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();
    const searchResponse: ILegacyResponse = await this.http.post<ILegacyResponse>(apiUrl + "/contact/send?bust=" + (new Date()).getTime(), contact, {headers: authHeader}).toPromise();
    return searchResponse;
  }
}
