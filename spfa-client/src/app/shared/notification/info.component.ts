import {Component} from "@angular/core";
@Component({

  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent {

  constructor() { }
  title: string;
  text: string;
  stackTrace: string;
}
