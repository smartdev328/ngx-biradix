import {Component, ViewEncapsulation} from '@angular/core';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-secure',
  templateUrl: './secure.component.html',
  styleUrls: ['./secure.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SecureComponent  {
  public me: any = {first: "Alex"};
  public logo: string = environment.baseUrl + "images/organizations/biradix.png";
  public baseUrl = environment.baseUrl;

  logoff() {

  }
}
