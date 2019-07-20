import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {HttpService} from "./http.service";
import {ILoggedInUser} from "../models";
import {BehaviorSubject} from "rxjs";
import {environment} from "../../../environments/environment";

@Injectable()
export class AuthService {
  self: BehaviorSubject<ILoggedInUser> = new BehaviorSubject<ILoggedInUser>(undefined);

  constructor(private http: HttpClient, private httpService: HttpService){
  }

  async getSelf(): Promise<ILoggedInUser> {
    const apiUrl = this.httpService.apiUrl;
    const authHeader = this.httpService.getAuthHeader();

    // No need to call the server if there is no cookie set
    if (!authHeader.Authorization) {
      this.self.next(null);
      return;
    }

    try {
      this.self.next(await this.http.get<ILoggedInUser>(apiUrl + "/api/1.0/users/me?bust" + (new Date()).getTime(), {headers: authHeader}).toPromise());
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
