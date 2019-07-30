import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ALERT_TYPE, IAlert} from "../models/alerts";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {AmenitiesService} from "./amenities.service";
import {IAmenity} from "../models/amenities";
import {ILoggedInUser} from "../models";
import {AuthService} from "./auth.service";
import {ApprovedListsService} from "./approvedLists.service";
import {APPROVED_LIST_LABELS, APPROVED_LIST_TYPE, IUnapprovedListFrequency} from "../models/approvedLists";

@Injectable()
export class AlertsService {
  private baseUrl = environment.baseUrl;
  private me: ILoggedInUser = null;
  alerts:  BehaviorSubject<IAlert[]> = new BehaviorSubject<IAlert[]>([]);

  constructor(private http: HttpClient,
              private amenitiesService: AmenitiesService,
              private authService: AuthService,
              private approvedListsService: ApprovedListsService){

  }

  initializeAlerts() {
    this.alerts.next([
      {type: ALERT_TYPE.AMENITIES, label: "Amenities", url: this.baseUrl + "#/amenities" , count: 0},
      {type: ALERT_TYPE.DATA_INTEGRITY, label: "Data Integrity", url: this.baseUrl + "#/history?active=1" , count: 0},
      {type: ALERT_TYPE.PROPERTY_OWNERS, label: APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.OWNER], url: this.baseUrl + "#/unapprovedLists?type=" + APPROVED_LIST_TYPE.OWNER, count: 0},
      {type: ALERT_TYPE.PROPERTY_MANAGERS, label: APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.MANAGER], url: this.baseUrl + "#/unapprovedLists?type=" + APPROVED_LIST_TYPE.MANAGER, count: 0},
      {type: ALERT_TYPE.CUSTOM_FEES, label: APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.FEES], url: this.baseUrl + "#/unapprovedLists?type=" + APPROVED_LIST_TYPE.FEES, count: 0},
    ]);

    // Subscribe to auth service to make sure to stop checking if logged out
    this.authService.self.subscribe((self: ILoggedInUser) => {
      this.me = self;
    });
  }

  startCheckingAlerts() {
    this.checkAmenities();
    this.checkUnapproved(APPROVED_LIST_TYPE.OWNER, ALERT_TYPE.PROPERTY_OWNERS);
    this.checkUnapproved(APPROVED_LIST_TYPE.MANAGER, ALERT_TYPE.PROPERTY_MANAGERS);
    this.checkUnapproved(APPROVED_LIST_TYPE.FEES, ALERT_TYPE.CUSTOM_FEES);
  }

  private updateAlerts(type: ALERT_TYPE, count: number) {
    const alerts: IAlert[] = this.alerts.getValue();
    const alert = alerts.find(a => a.type === type);
    alert.count = count;
    this.alerts.next(alerts);
  }

  private async checkAmenities() {
    if (!this.me) {
      return;
    }
    const amenities:IAmenity[] = await this.amenitiesService.search({active: true, unapproved: true});
    this.updateAlerts(ALERT_TYPE.AMENITIES, amenities.length);
    setTimeout(()=> {
      this.checkAmenities();
    }, 120000);
  }

  private async checkUnapproved(unapprovedType: APPROVED_LIST_TYPE, alertType: ALERT_TYPE) {
    if (!this.me) {
      return;
    }
    const frequency: IUnapprovedListFrequency[] = await this.approvedListsService.getUnapprovedFrequency(unapprovedType);
    this.updateAlerts(alertType, frequency.length);
    setTimeout(()=> {
      this.checkUnapproved(unapprovedType, alertType);
    }, 120000);
  }
}
