import { NgModule } from '@angular/core';
import { SecureRoutingModule } from './secure.routing.module';
import { SecureComponent, HelpComponent } from './pages';
import {SharedModule} from "../shared";

@NgModule({
  declarations: [SecureComponent, HelpComponent],
  imports: [
    SecureRoutingModule,
    SharedModule
  ],
  providers: [],
})
export class SecureModule { }
