import { Injectable } from '@angular/core';
import {CookieService} from "ngx-cookie-service";

@Injectable()
export class HttpService {

  constructor(private cookieService: CookieService){
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
    this.cookieService.set('token', "", (new Date()).getTime() - 1, '/');
    this.cookieService.set('tokenDate', "", (new Date()).getTime() - 1, '/');
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
