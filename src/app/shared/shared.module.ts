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
  MatButtonModule, MatInputModule, MatCardModule, MatAutocompleteModule, MatBadgeModule
} from "@angular/material";
import {LoaderComponent} from "./components";
import {UserIdleModule} from "angular-user-idle";
import {FlexLayoutModule} from "@angular/flex-layout";
import {HighlightPipe} from "./pipes/highlight.pipe";
import {MdePopoverModule} from "@material-extended/mde";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import {faBuilding, faEyeSlash} from "@fortawesome/free-solid-svg-icons";

export const MaterialModules = [
  MatProgressSpinnerModule,
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatMenuModule,
  MatListModule,
  MatInputModule,
  MatCardModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatButtonModule,
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    UserIdleModule.forRoot({idle: 600, timeout: 300, ping: 120}),
    FlexLayoutModule,
    MdePopoverModule,
    FontAwesomeModule,
    ...MaterialModules
  ],
  declarations: [ LoaderComponent, HighlightPipe ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    LoaderComponent,
    UserIdleModule,
    FlexLayoutModule,
    HighlightPipe,
    MdePopoverModule,
    FontAwesomeModule,
    ...MaterialModules
  ]
})
export class SharedModule {
  constructor() {
    // Add an icon to the library for convenient access in other components
    library.add(faEyeSlash);
    library.add(faBuilding);
  }
}
