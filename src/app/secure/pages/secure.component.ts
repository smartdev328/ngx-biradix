import { Component} from '@angular/core';
import {ILoggedInUser} from "../../core/models";
import { environment } from './../../../environments/environment'

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss']
})
export class SecureComponent  {
  public me: any = {first: "Alex"};
  public logo: string = environment.baseUrl + "images/organizations/biradix.png";
  public baseUrl = environment.baseUrl;

  logoff() {

  }
}
