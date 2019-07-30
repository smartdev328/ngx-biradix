import {Component, ViewEncapsulation} from '@angular/core';
import { environment } from '../../../environments/environment'
import {ILoggedInUser} from "../../core/models";
import {AlertsService, AuthService, HttpService, PropertyService, SiteService} from "../../core/services";
import {UserIdleService} from "angular-user-idle";
import {MediaChange, MediaObserver} from "@angular/flex-layout";
import {Observable, of, Subscription} from "rxjs";
import {IProperty} from "../../core/models/property";
import {FormControl} from "@angular/forms";
import {debounceTime, startWith, switchMap} from "rxjs/operators";
import {PERMISSIONS} from "../../core/models/permissions";
import {IAlert} from "../../core/models/alerts";

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss', './secure.topnav.scss', './secure.sidenav.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SecureComponent  {
  public me: ILoggedInUser = null;
  public logoBig: string = environment.baseUrl + "images/organizations/biradix.png";
  public logoSmall: string = environment.baseUrl + "images/organizations/biradix-small.png";
  public baseUrl = environment.baseUrl;
  private verifyUserInterval = null;
  private mediaWatcher: Subscription;
  public mediaAlias = "";
  public propertyAutoComplete$: Observable<IProperty> = null;
  public autoCompleteControl = new FormControl();
  public autoCompleteSearch: string;
  public env: string = '';
  readonly PERMISSIONS: typeof PERMISSIONS = PERMISSIONS;
  public uiVersion: string;
  public alerts: IAlert[];

  constructor(private authService: AuthService,
              private userIdle: UserIdleService,
              private mediaObserver: MediaObserver,
              private propertyService: PropertyService,
              private siteService: SiteService,
              private alertsService: AlertsService) {
  }

  ngOnInit() {
    this.autoCompleteLogic();
    this.layoutLogic();
    this.selfLogic();
    this.idleLogic();
    this.enviornmentLogic();
    this.versionLogic();
    this.alertsLogic();
  }

  logoff() {
    this.logOffLogic(false);
  }

  throwError() {
    throw new Error("Fake error");
  }

  hasPermission(permission: PERMISSIONS) {
    if (!this.me) {
      return false;
    }

    return this.me.permissions.indexOf(permission) > -1;
  }

  alertsLogic() {
    this.alertsService.initializeAlerts();
    this.alertsService.alerts.subscribe((alerts: IAlert[]) => {
      this.alerts = alerts.filter((a: IAlert) => a.count > 0);
    });
  }

  autoCompleteLogic() {
    this.propertyAutoComplete$ = this.autoCompleteControl.valueChanges.pipe(
      startWith(''),
      // delay emits
      debounceTime(300),
      // use switch map so as to cancel previous subscribed events, before creating new once
      switchMap(value => {
        this.autoCompleteSearch = value;
        if (value !== '') {
          // lookup from github
          return this.propertyService.search({search: value, limit: 10, skipAmenities: true, hideCustom: true, active: true, hideCustomComps: true});
        } else {
          // if no value is present, return null
          return of(null);
        }
      })
    );
  }

  autoCompleteSelected(value: IProperty) {
    if (value) {
      location.href= this.baseUrl + "#/profile/" + value._id;
    }
  }

  autoCompleteDisplay(property?: IProperty): string | undefined {
    return property ? property.name : undefined;
  }

  closeSideNavLogic(sidenav) {
    if (this.mediaAlias === "xs") {
      sidenav.close();
    }
  }

  layoutLogic() {
    this.mediaWatcher = this.mediaObserver.media$.subscribe((change: MediaChange) => {
      this.mediaAlias = change.mqAlias;
    });
  }

  versionLogic() {
    this.siteService.uiVersion.subscribe((version: string) => {
      this.uiVersion = version;
    });
  }

  selfLogic() {
    this.authService.self.subscribe((self: ILoggedInUser) => {
      this.me = self;

      if (this.me === null) {
        // If we get here that means we checked the server and did not get a logged in user

        // If we are logged out automatically, remember what page we were on
        this.logOffLogic(true);
      } else if (this.me && !this.verifyUserInterval) {
        // After you get a successfull user for the first time, keep checking against the server every 60 seconds
        this.verifyUserInterval = setInterval(() => {
          this.authService.getSelf();
        }, 60 * 1000);
      }

      if (this.me) {
        const el = document.getElementById("favicon");
        el.setAttribute("href", this.baseUrl + "images/organizations/" + this.me.orgs[0].logoSmall);
        this.logoSmall = this.baseUrl + "images/organizations/" + this.me.orgs[0].logoSmall;
        this.logoBig = this.baseUrl + "images/organizations/" + this.me.orgs[0].logoBig;
      }
    });
  }
  idleLogic() {
    // set a 60 minute idle timer
    this.userIdle.setConfigValues({idle: 60 * 60, timeout: 20, ping: 120})
    //Start watching for user inactivity.
    this.userIdle.startWatching();

    // Start watching when user idle is starting.
    this.userIdle.onTimerStart().subscribe(count => {
      this.userIdle.stopTimer();
      // if we go idle, save page and logoff
      this.logOffLogic(true);
    });
  }

  logOffLogic(savePage: boolean) {
    if (window.sessionStorage) {
      if (savePage) {
        window.sessionStorage.setItem("redirect", location.href);
      } else {
        window.sessionStorage.removeItem("redirect");
      }
    }
    clearInterval(this.verifyUserInterval);
    this.authService.logoff();
  }

  enviornmentLogic() {
    const loc = this.siteService.apiUrl.toLowerCase();

    if (loc.indexOf('//localhost') > -1) {
      this.env = "This is API-LOCAL";
    }
    else
    if (loc.indexOf('//api-qa.biradix.com') > -1) {
      this.env = "This is API-QA";
    }
    else
    if (loc.indexOf('//biradixapi-qa-pr-') > -1) {
      this.env = "This is API-PR-" + loc.match("pr-([0-9]+).")[1];
    }
    else
    if (loc.indexOf('//biradixapi-integration') > -1) {
      this.env = "This is API-INT";
    }
  }
}
