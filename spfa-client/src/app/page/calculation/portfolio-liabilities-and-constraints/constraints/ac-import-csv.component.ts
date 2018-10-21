import {Component, Inject, ViewEncapsulation, OnInit} from "@angular/core";
import {Calculation} from "../../../../base/calculation/model/calculation.model";
import {MD_DIALOG_DATA} from "@angular/material";
import {CalculationService} from "../../../../base/calculation/calculation.service";
import {NotificationService} from "../../../../shared/notification/notification.service";
@Component({
  templateUrl: 'ac-import-csv.component.html',
  encapsulation: ViewEncapsulation.None
})
export class AssetClassImportCsvComponent {

  private uploading : boolean = false;
  private progress;

  get isUploading() : boolean {
    return this.uploading;
  }

  constructor(@Inject(MD_DIALOG_DATA) public calculation: Calculation, private calculationService: CalculationService, private notificationService: NotificationService) { }

  onStart() {
    this.uploading = true;
  }

  onFail() {
    this.uploading = false;
  }

  onSuccess() {
    this.uploading = false;
    this.calculationService.reimportAssetClassesAllocationAndConstraints(), error => {

      this.notificationService.openInfo( {

        title: 'We encountered an issue.',
        text: 'The import of the CSV file failed.'

      } );
      console.error( error );
    };
  }

}
