import {Component, ViewEncapsulation} from '@angular/core';
import { environment } from '../../../environments/environment'
import {ILoggedInUser} from "../../core/models";
import {AuthService} from "../../core/services";

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SecureComponent  {
  public me: ILoggedInUser = null;
  public logo: string = environment.baseUrl + "images/organizations/biradix.png";
  public baseUrl = environment.baseUrl;

  constructor(private authService: AuthService) {
    this.authService.self.subscribe((self: ILoggedInUser) => {
      this.me = self;

      if (this.me === null) {
        this.authService.logoff();
      }
    })
  }

  logoff() {
    this.authService.logoff();
  }
}
