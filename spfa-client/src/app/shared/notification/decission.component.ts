import {Component} from "@angular/core";
import {DecissionOption} from "./notification.service";
@Component({

  templateUrl: './decission.component.html',
  styleUrls: ['./decission.component.scss']
})
export class DecissionComponent {

  constructor() { }
  title: string;
  question: string;
  options: DecissionOption[]

  callOption( option: DecissionOption ) {

    if (option.onClick)
      option.onClick();
  }
}
