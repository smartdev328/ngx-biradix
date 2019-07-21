import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatIconModule, MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatToolbarModule,
  MatButtonModule, MatInputModule, MatCardModule
} from "@angular/material";
import {LoaderComponent} from "./components";
import {UserIdleModule} from "angular-user-idle";
import {FlexLayoutModule} from "@angular/flex-layout";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatMenuModule,
    MatListModule,
    UserIdleModule.forRoot({idle: 600, timeout: 300, ping: 120}),
    FlexLayoutModule,
    MatInputModule,
    MatCardModule

  ],
  declarations: [ LoaderComponent ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatMenuModule,
    MatListModule,
    MatButtonModule,
    LoaderComponent,
    UserIdleModule,
    FlexLayoutModule,
    MatInputModule,
    MatCardModule
  ]
})
export class SharedModule {
}
