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

  setAuthCookie(token: string) {
    let expires = (new Date());
    expires.setTime(expires.getTime() + (60*60*1000));
    this.cookieService.set('token', token, expires, '/');
    this.cookieService.set('tokenDate', (new Date()).toString(), expires, '/');
  }

  getAuthCookieDate() {
    const date = new Date(this.cookieService.get("tokenDate"));
    return date;
  }

  deleteAuthCookies() {
    if (location.hostname.indexOf("localhost") > -1) {
      this.cookieService.delete("token", "/", location.hostname);
      this.cookieService.delete("tokenDate", "/", location.hostname);
    } else {
      this.cookieService.delete("token");
      this.cookieService.delete("tokenDate");
    }
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
