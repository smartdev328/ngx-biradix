import { Component } from '@angular/core';
import {HttpService} from "./core/services";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loaded: boolean = false;
  constructor(private httpService: HttpService) {
  }

  async ngOnInit() {
    // get api url form the web service. we have to do this because its controlled with server env variables which can change without a re-build
    await this.httpService.lookupApiUrl();
    const apiUrl: string = this.httpService.getApiUrl();
    this.loaded = true;
  }
}
