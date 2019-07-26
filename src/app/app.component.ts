import { Component } from '@angular/core';
import {AuthService, HttpService, SiteService} from "./core/services";
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loaded: boolean = false;
  down: boolean = false;
  staticPath: string = environment.deployUrl;

  constructor(private httpService: HttpService, private authService: AuthService, private siteService: SiteService) {
  }

  async ngOnInit() {
    // get api url form the web service. we have to do this because its controlled with server env variables which can change without a re-build
    await this.httpService.lookupApiUrl();
    await this.authService.getSelf();
    this.loaded = true;

    // Subscribe to the needs refresh observer
    this.siteService.needsRefresh.subscribe((isReady: boolean) => {
      if (isReady) {
        window.location.reload();
      }
    });

    // Check every minute if we need to refresh;
    setInterval(()=> {
      this.siteService.checkHash();
    }, 1000 * 60);


    // Subscribe to the api down observer
    this.siteService.apiDown.subscribe((isDown: boolean) => {
      if (isDown) {
       this.down = true;
      }
    });

  }
}
