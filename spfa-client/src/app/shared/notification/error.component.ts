import {Component} from "@angular/core";
import {InfoComponent} from "@app/shared/notification/info.component";
@Component({

  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class ErrorComponent extends InfoComponent{

  constructor() { super() }

  stackTrace: string;
  rootCause: string;
}
