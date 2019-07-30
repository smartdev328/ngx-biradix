import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ALERT_TYPE, IAlert} from "../models/alerts";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable()
export class AlertsService {
  private baseUrl = environment.baseUrl;
  alerts:  BehaviorSubject<IAlert[]> = new BehaviorSubject<IAlert[]>([]);

  constructor(private http: HttpClient){

  }

  initializeAlerts() {
    this.alerts.next([
      {type: ALERT_TYPE.AMENITIES, label: "Amenities", url: this.baseUrl + "#/amenities" , count: 0},
      {type: ALERT_TYPE.DATA_INTEGRITY, label: "Data Integrity", url: this.baseUrl + "#/history?active=1" , count: 0},
      {type: ALERT_TYPE.PROPERTY_OWNERS, label: "Property:Owners", url: this.baseUrl + "#/unapprovedLists?type=OWNER", count: 0},
      {type: ALERT_TYPE.PROPERTY_MANAGERS, label: "Property:Management", url: this.baseUrl + "#/unapprovedLists?type=MANAGER", count: 0},
      {type: ALERT_TYPE.CUSTOM_FEES, label: "Custom Fees & Deposits", url: this.baseUrl + "#/unapprovedLists?type=FEES", count: 0},
    ]);
  }
}
