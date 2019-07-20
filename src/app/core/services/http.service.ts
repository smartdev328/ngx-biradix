import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {CookieService} from "ngx-cookie-service";

interface apiUrlModel {
  apiUrl: string;
}

@Injectable()
export class HttpService {
  apiUrl: string;


  constructor(private http:HttpClient, private cookieService: CookieService){
  }

  async lookupApiUrl() {
    const apiUrlModel = await this.http.get<apiUrlModel>(environment.baseUrl + "apiUrl").toPromise();
    this.apiUrl = apiUrlModel.apiUrl;
  }

  getApiUrl() {
    return this.apiUrl;
  }

  deleteAuthCookies() {
    this.cookieService.delete("token", "/", location.hostname);
    this.cookieService.delete("tokenDate", "/", location.hostname);
  }

  getAuthHeader() {
    const token: string = this.cookieService.get("token");

    if (token) {
      return {Authorization: 'Bearer ' + token };
    } else {
      return {};
    }
  }
}
