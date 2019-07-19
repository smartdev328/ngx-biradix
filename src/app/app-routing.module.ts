import { NgModule } from '@angular/core';
import {Routes, RouterModule, Router, NavigationEnd, ActivatedRouteSnapshot} from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/secure/help', pathMatch: 'full'},
  { path: '**', redirectTo: '/secure/help'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  getDeepestTitle(routeSnapshot: ActivatedRouteSnapshot) {
    var title = routeSnapshot.data ? routeSnapshot.data['title'] : '';
    if (routeSnapshot.firstChild) {
      title = this.getDeepestTitle(routeSnapshot.firstChild) || title;
    }
    return title;
  }

  watchRouteChanges() {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        //Change browser title to title property on route after a route change
        var title = this.getDeepestTitle(this.router.routerState.snapshot.root)

        if (title) {
          document.title = title + ' | BI:Radix';
        } else {
          document.title = 'BI:Radix';
        }
      }
    });
  }

  constructor (private router : Router) {
    this.watchRouteChanges();
  }

}
