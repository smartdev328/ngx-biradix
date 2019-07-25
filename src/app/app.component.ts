import { Component } from '@angular/core';
import {AuthService, HttpService, VersionService} from "./core/services";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loaded: boolean = false;
  constructor(private httpService: HttpService, private authService: AuthService, private versionService: VersionService) {
  }

  async ngOnInit() {
    // get api url form the web service. we have to do this because its controlled with server env variables which can change without a re-build
    await this.httpService.lookupApiUrl();
    await this.authService.getSelf();
    this.loaded = true;

    // Subscribe to the needs refresh observer
    this.versionService.needsRefresh.subscribe((isReady: boolean) => {
      if (isReady) {
        window.location.reload();
      }
    });

    // Check every minute if we need to refresh;
    setInterval(()=> {
      this.versionService.checkHash();
    }, 1000 * 60);



  }
}
