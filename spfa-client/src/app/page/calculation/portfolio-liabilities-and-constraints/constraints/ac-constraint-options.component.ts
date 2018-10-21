import {Component, Input, ViewEncapsulation} from "@angular/core";
import {ACConstraintChartData} from "./ac-constraint-chart.model";
import {AssetClassGroup} from "../../../../base/asset-class/asset-class.model";

@Component({

  selector: 'ac-constraint-options',
  templateUrl: './ac-constraint-options.component.html',
  styleUrls: ['./ac-constraint-options.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintOptionsComponent {

  @Input()
  assetClassGroup: AssetClassGroup;

  @Input()
  chartData: ACConstraintChartData;

  get isBreaching(): boolean {

    return false;

    // return AllocationConstraintUtil.isBreaching( this.assetClassGroup.metadata.allocationSum,
    //   this.assetClassGroup.allocationConstraint, ! this.assetClassGroup.assetClass);
  }

  toggleAggregate(e: MouseEvent) {

    e.stopPropagation();
    this.assetClassGroup.allocationConstraint.userAdjustedAggregation = !this.assetClassGroup.allocationConstraint.userAdjustedAggregation;
    this.chartData.onAdjust.next();
  }
}
