import { NgModule } from '@angular/core';
import { SecureRoutingModule } from './secure.routing.module';
import { SecureComponent, HelpComponent, TempComponent } from './pages';
import {SharedModule} from "../shared";

@NgModule({
  declarations: [SecureComponent, HelpComponent, TempComponent],
  imports: [
    SecureRoutingModule,
    SharedModule
  ],
  providers: [],
})
export class SecureModule { }
