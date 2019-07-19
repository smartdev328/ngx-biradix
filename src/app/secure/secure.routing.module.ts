import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecureComponent, HelpComponent, TempComponent } from './pages';

const routes: Routes = [
  {   path: 'secure', component: SecureComponent,
    children :[
      { path: '', redirectTo: '/', pathMatch: 'full'},
      { path: 'help', component: HelpComponent, data: {title: 'Help'}},
      { path: 'temp', component: TempComponent, data: {title: 'Temp'}},
      { path: '**', redirectTo: '/' }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecureRoutingModule { }
