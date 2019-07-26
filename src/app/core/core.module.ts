import { NgModule, Optional, SkipSelf } from '@angular/core';
import {AuthService, ContactService, HttpService, PropertyService, VersionService} from './services';
import {CookieService} from "ngx-cookie-service";
import {SecureAuthGuard} from "./guards";

@NgModule({
  imports: [
  ],
  providers: [
    SecureAuthGuard,
    CookieService,
    HttpService,
    AuthService,
    PropertyService,
    VersionService,
    ContactService
  ],
  declarations: []
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() core:CoreModule ){
    if (core) {
      throw new Error("You should import core module only in the root module")
    }
  }
}
