import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecureComponent, HelpComponent, ApprovedListsComponent } from './pages';
import {SecureAuthGuard} from "../core";

const routes: Routes = [
  {   
    path: 'secure', component: SecureComponent,
    children :[
      { path: '', redirectTo: '/', pathMatch: 'full'},
      { path: 'help', component: HelpComponent, data: {title: 'Help'}},
      { path: 'approved-lists', component: ApprovedListsComponent, data: {title: 'Approved list'}},
      { path: '**', redirectTo: '/' }
    ], canActivate: [SecureAuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecureRoutingModule { }
