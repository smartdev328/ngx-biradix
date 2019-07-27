import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {ILoggedInUser, IloggedInUserWithToken} from "../models";
import {BehaviorSubject} from "rxjs";
import {environment} from "../../../environments/environment";
import {SiteService} from "./site.service";

@Injectable()
export class AuthService {
  self: BehaviorSubject<ILoggedInUser> = new BehaviorSubject<ILoggedInUser>(undefined);

  constructor(private http: HttpClient, private httpService: HttpService, private siteService: SiteService){
  }

  async refreshToken(): Promise<ILoggedInUser> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    // No need to call the server if there is no cookie set
    if (!authHeader.Authorization) {
      this.self.next(null);
      return;
    }

    try {
      const userWithToken = await this.http.get<IloggedInUserWithToken>(apiUrl + "/api/1.0/users/refreshToken?bust=" + (new Date()).getTime(), {headers: authHeader}).toPromise();
      this.self.next(userWithToken.user);
      this.httpService.setAuthCookie(userWithToken.token);
    } catch(err) {

      if (err.status === 401) {
        this.self.next(null);
      }
      // do nothing else here on error.
    }
    return this.self.getValue();
  }

  async getSelf(): Promise<ILoggedInUser> {
    const apiUrl = this.siteService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    // No need to call the server if there is no cookie set
    if (!authHeader.Authorization) {
      this.self.next(null);
      return;
    }

    const tokenDate = this.httpService.getAuthCookieDate();
    const minutesOldTokenDate = ((new Date()).getTime() - tokenDate.getTime()) / 1000 / 60;

    if (minutesOldTokenDate > 50) {
      return this.refreshToken();
    }

    try {
      this.self.next(await this.http.get<ILoggedInUser>(apiUrl + "/api/1.0/users/me?bust=" + (new Date()).getTime(), {headers: authHeader}).toPromise());
    } catch(err) {

      if (err.status === 401) {
        this.self.next(null);
      }
      // do nothing else here on error.
    }
    return this.self.getValue();
  }

  logoff() {
    this.httpService.deleteAuthCookies();
    location.href= environment.baseUrl;
  }

  // we only need to know if there is an auth token to see if we are logged in, for the guard
  isLoggedIn() {
    const authHeader = this.httpService.getAuthHeader();

    return authHeader.Authorization;
  }
}
