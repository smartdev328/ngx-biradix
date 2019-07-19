import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {SecureModule} from "./secure/secure.module";
import {CoreModule} from "./core";
import {SharedModule} from "./shared";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SecureModule,
    AppRoutingModule,
    CoreModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
