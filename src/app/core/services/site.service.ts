import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material";
import * as rg4js from 'raygun4js';

interface IServerVariablesModel {
  apiUrl: string;
  version: string;
  raygun_key: string;
}

@Injectable()
export class SiteService {
  private hash: string = "";
  needsRefresh:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  apiDown:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  apiUrl: string;
  uiVersion: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(private http: HttpClient, private snackBar: MatSnackBar){
  }

  async lookupServerVariables() {
    const response = await this.http.get<IServerVariablesModel>(environment.baseUrl + "serverVariables").toPromise();
    this.apiUrl = response.apiUrl;
    this.uiVersion.next(response.version);

    rg4js('apiKey', response.raygun_key);
    rg4js('setVersion', this.uiVersion.getValue());
    rg4js('enableCrashReporting', true);

    rg4js('onBeforeSend', function (payload) {
      if (window['FS'] && window['FS'].getCurrentSessionURL) {
        payload.Details.UserCustomData.fullStoryUrl = (window['FS'].getCurrentSessionURL() || "").replace("%3A", ":");
      }
      return payload;
    });
  }

  handleApiError() {
    this.apiDown.next(true);
    this.snackBar.open("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page.", 'X', {panelClass: ["snack-bar-error"]});
    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
  }

  async checkHash() {
    try {
      const newHash = await this.http.get<string>(environment.baseUrl + "version.json?bust=" + (new Date()).getTime()).toPromise();
      if (newHash && this.hash && this.hash !== newHash) {
        this.needsRefresh.next(true);
      } else {
        this.needsRefresh.next(false);
      }

      this.hash = newHash;

    } catch (err) {
      // Do nothing if we cant find the hash
    }
  }
}
