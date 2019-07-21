import {Component, ViewEncapsulation} from '@angular/core';
import { environment } from '../../../environments/environment'
import {ILoggedInUser} from "../../core/models";
import {AuthService} from "../../core/services";
import {UserIdleService} from "angular-user-idle";
import {MediaChange, MediaObserver} from "@angular/flex-layout";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss'],
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

  constructor(private authService: AuthService, private userIdle: UserIdleService, private mediaObserver: MediaObserver) {
  }

  ngOnInit() {
    this.layoutLogic();
    this.selfLogic();
    this.idleLogic();
  }

  logoff() {
    this.logOffLogic(false);
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
}
