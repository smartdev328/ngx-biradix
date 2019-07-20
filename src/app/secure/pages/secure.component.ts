import {Component, ViewEncapsulation} from '@angular/core';
import { environment } from '../../../environments/environment'
import {ILoggedInUser} from "../../core/models";
import {AuthService} from "../../core/services";
import {UserIdleService} from "angular-user-idle";

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SecureComponent  {
  public me: ILoggedInUser = null;
  public logo: string = environment.baseUrl + "images/organizations/biradix.png";
  public baseUrl = environment.baseUrl;
  private verifyUserInterval = null;

  constructor(private authService: AuthService, private userIdle: UserIdleService) {
  }

  ngOnInit() {
    this.authService.self.subscribe((self: ILoggedInUser) => {
      this.me = self;

      if (this.me === null) {
        // If we get here that means we checked the server and did not get a logged in user

        // If we are logged out automatically, remember what page we were on
        if (window.sessionStorage) {
          window.sessionStorage.setItem("redirect", location.href);
        }
        clearInterval(this.verifyUserInterval);
        this.authService.logoff();
      } else if (this.me && !this.verifyUserInterval) {
        // After you get a successfull user for the first time, keep checking against the server every 60 seconds
        this.verifyUserInterval = setInterval(() => {
          this.authService.getSelf();
        }, 60 * 1000);
      }
    })

    // set a 60 minute idle timer
    this.userIdle.setConfigValues({idle: 60 * 60, timeout: 20, ping: 120})
    //Start watching for user inactivity.
    this.userIdle.startWatching();

    // Start watching when user idle is starting.
    this.userIdle.onTimerStart().subscribe(count => {
      this.userIdle.stopTimer();
      // if we go idle, save page and logoff
      if (window.sessionStorage) {
        window.sessionStorage.setItem("redirect", location.href);
      }
      clearInterval(this.verifyUserInterval);
      this.authService.logoff();
    });

  }

  logoff() {
    if (window.sessionStorage) {
      window.sessionStorage.removeItem("redirect");
    }
    clearInterval(this.verifyUserInterval);
    this.authService.logoff();
  }
}
