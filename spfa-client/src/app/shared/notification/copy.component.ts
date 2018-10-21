import {Component, ViewChild, AfterViewInit} from "@angular/core";
@Component({

  templateUrl: './copy.component.html',
  styleUrls: ['./copy.component.scss']
})
export class CopyComponent implements AfterViewInit {

  copyText: string;

  @ViewChild('copyField')
  private copyFieldElementRef;

  constructor() { }

  ngAfterViewInit() {

    this.copy();
  }

  copy() {

    let copyField = this.copyFieldElementRef.nativeElement;
    copyField.innerHTML = this.copyText;

    if (copyField && copyField.select) {

      copyField.select();

      try {
        document.execCommand('copy');
        copyField.blur();

      } catch ( error ) {

        alert('error');
      }
    }

  }

}
