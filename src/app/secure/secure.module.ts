import { NgModule } from '@angular/core';
import { SecureRoutingModule } from './secure.routing.module';
import { SecureComponent, HelpComponent, TempComponent } from './pages';

@NgModule({
  declarations: [SecureComponent, HelpComponent, TempComponent],
  imports: [
    SecureRoutingModule,
  ],
  providers: [],
})
export class SecureModule { }
