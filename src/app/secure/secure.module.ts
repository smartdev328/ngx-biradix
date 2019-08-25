import { NgModule } from '@angular/core';
import { SecureRoutingModule } from './secure.routing.module';
import {SecureComponent, HelpComponent, HelpTrainingComponent, ApprovedListsComponent} from './pages';
import {SharedModule} from "../shared";

@NgModule({
  declarations: [SecureComponent, HelpComponent, ApprovedListsComponent, HelpTrainingComponent],
  entryComponents: [HelpTrainingComponent],
  imports: [
    SecureRoutingModule,
    SharedModule
  ],
  providers: [],
})
export class SecureModule { }
