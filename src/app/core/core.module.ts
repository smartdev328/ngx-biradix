import { NgModule, Optional, SkipSelf } from '@angular/core';
import {HttpService} from './services';

@NgModule({
  imports: [
  ],
  providers: [
    HttpService
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
