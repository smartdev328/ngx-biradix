import { Component } from '@angular/core';
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html'
})
export class LoaderComponent {
  staticPath: string = environment.deployUrl;
}
