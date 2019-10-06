import {Component, Input} from '@angular/core';
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html'
})
export class LoaderComponent {
  @Input() verticalMargin: number = 50;
  staticPath: string = environment.deployUrl;
}
