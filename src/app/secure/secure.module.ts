import { NgModule } from '@angular/core';
import { SecureRoutingModule } from './secure.routing.module';
import {SecureComponent, HelpComponent, HelpTrainingComponent, UnapprovedListsEditComponent, ApprovedListsComponent, UnapprovedListsComponent} from './pages';
import {SharedModule} from "../shared";

@NgModule({
  declarations: [SecureComponent, HelpComponent, ApprovedListsComponent, UnapprovedListsComponent, HelpTrainingComponent, UnapprovedListsEditComponent],
  entryComponents: [HelpTrainingComponent, UnapprovedListsEditComponent],
  imports: [
    SecureRoutingModule,
    SharedModule
  ],
  providers: [],
})
export class SecureModule { }
