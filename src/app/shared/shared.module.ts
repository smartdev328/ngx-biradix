import { CommonModule } from '@angular/common';
import {ErrorHandler, ModuleWithProviders, NgModule} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatToolbarModule,
  MatButtonModule,
  MatInputModule,
  MatCardModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatSnackBarModule,
  MatSelectModule,
  MatTableModule,
  MatPaginatorModule, 
  MatSortModule,
  MAT_SNACK_BAR_DEFAULT_OPTIONS, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule
} from "@angular/material";
import {ConfirmComponent, LoaderComponent} from "./components";
import {UserIdleModule} from "angular-user-idle";
import {FlexLayoutModule} from "@angular/flex-layout";
import {MdePopoverModule} from "@material-extended/mde";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faChartBar,
  faEyeSlash,
  faHistory, 
  faPowerOff, 
  faQuestion,
  faCheck,
  faUser,
  faUsers,
  faWrench,
  faTrashAlt,
  faTachometerAlt, faCaretDown, faSearch, faBars, faTimes, faBell
} from "@fortawesome/free-solid-svg-icons";
import {RaygunErrorHandler} from "./providers/raygun.provider";
import {HighlightPipe} from "./pipes";
import {FocusDirective} from "./directives/focus.directive";

export const MaterialModules = [
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatSidenavModule,
  MatMenuModule,
  MatListModule,
  MatInputModule,
  MatCardModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatButtonModule,
  MatSnackBarModule,
  MatDialogModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatCheckboxModule,
  MatIconModule,
  MatSelectModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule
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
  declarations: [ LoaderComponent, HighlightPipe, FocusDirective, ConfirmComponent ],
  entryComponents: [ConfirmComponent],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    LoaderComponent,
    FocusDirective,
    UserIdleModule,
    FlexLayoutModule,
    HighlightPipe,
    MdePopoverModule,
    FontAwesomeModule,
    ConfirmComponent,
    ...MaterialModules
  ],
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {duration: 5000, horizontalPosition: 'right', verticalPosition: 'top'}
    },
    {
      provide: ErrorHandler,
      useClass: RaygunErrorHandler
    }
  ]
})
export class SharedModule {
  constructor() {
    // Add an icon to the library for convenient access in other components
    library.add(faEyeSlash);
    library.add(faBuilding);
    library.add(faUser);
    library.add(faUsers);
    library.add(faTachometerAlt);
    library.add(faChartBar);
    library.add(faHistory);
    library.add(faWrench);
    library.add(faPowerOff);
    library.add(faQuestion);
    library.add(faCheck);
    library.add(faCaretDown);
    library.add(faSearch);
    library.add(faBars);
    library.add(faTimes);
    library.add(faBell);
    library.add(faTrashAlt);
  }
}
