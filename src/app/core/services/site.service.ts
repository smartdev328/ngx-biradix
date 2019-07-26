import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material";

@Injectable()
export class SiteService {
  private hash: string = "";
  needsRefresh:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  apiDown:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private snackBar: MatSnackBar){
  }

  handleApiError() {
    this.apiDown.next(true);
    this.snackBar.open("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page.", 'X', {panelClass: ["snack-bar-error"]});
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
