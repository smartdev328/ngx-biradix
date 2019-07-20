import { NgModule, Optional, SkipSelf } from '@angular/core';
import {AuthService, HttpService} from './services';
import {CookieService} from "ngx-cookie-service";
import {SecureAuthGuard} from "./guards";

@NgModule({
  imports: [
  ],
  providers: [
    SecureAuthGuard,
    CookieService,
    HttpService,
    AuthService
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
