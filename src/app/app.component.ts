import { Component, ViewEncapsulation } from '@angular/core';
import {AuthService, SiteService} from "./core/services";
import {environment} from "../environments/environment";
import {ILoggedInUser} from "./core/models";
import * as rg4js from 'raygun4js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss', 
    './css/modals.scss',
    './css/typography.scss',
    './css/alerts.scss',
    './css/navigation.scss',
    './css/forms.scss',
    './css/buttons.scss',
    './css/general.scss',
    './css/table.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  loaded: boolean = false;
  down: boolean = false;
  staticPath: string = environment.deployUrl;

  constructor(private authService: AuthService, private siteService: SiteService) {
  }

  async ngOnInit() {
    // get api url form the web service. we have to do this because its controlled with server env variables which can change without a re-build
    await this.siteService.lookupServerVariables();
    const me: ILoggedInUser = await this.authService.getSelf();
    
    if (me) {
      rg4js('setUser', {
        identifier: me.email,
        isAnonymous: false,
        email: me.email,
        firstName: me.first + " - org: " + me.orgs[0].name,
        fullName: me.first + " " + me.last
      });

      window['FS'].identify(me._id, {
        displayName: me.first + " " + me.last,
        email: me.email,
        org_str: me.orgs[0].name
      });
    }
    
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
