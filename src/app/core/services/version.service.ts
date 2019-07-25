import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class VersionService {
  private hash: string = "";
  needsRefresh:  BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient){
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
