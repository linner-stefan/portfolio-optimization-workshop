import {
  Component, ViewEncapsulation, Input, ViewChildren, QueryList, AfterViewInit, AfterViewChecked,
  OnInit, OnChanges
} from "@angular/core";
import {ACConstraintChartData} from "../ac-constraint-chart.model";
import {DualConstraint} from "../../../../../base/asset-class/asset-class.model";
import {ValueUtil} from "../../../../../shared/value.util";
@Component({

  selector: 'ac-constraint-info-notifications',
  templateUrl: './ac-constraint-info-notifications.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintInfoNotificationsComponent implements OnInit, OnChanges {

  @Input()
  chartData: ACConstraintChartData;

  @Input()
  dualConstraints: DualConstraint[];

  numAdditionalNotifications : number = 0;
  additionalNotifications: boolean = false;

  get isHundred() : boolean {

    return ValueUtil.getPercentRounded( this.chartData.allocationSum ) == 100;
  }

  ngOnInit() {

    if (this.dualConstraints)
      this.numAdditionalNotifications = this.dualConstraints.length;
    else
      this.numAdditionalNotifications = 0;
  }

  ngOnChanges() {

    this.ngOnInit();
  }

  toggleAdditionoalNotifications() {

    this.additionalNotifications = !this.additionalNotifications;
  }
}
