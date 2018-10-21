import {Component, ViewEncapsulation, Input, OnInit} from "@angular/core";
import {AssetClassGroup} from "../../../../base/asset-class/asset-class.model";
import {ACConstraintChartData} from "./ac-constraint-chart.model";
@Component({

  selector: 'ac-constraint-hierarchy',
  templateUrl: './ac-constraint-hierarchy.component.html',
  styleUrls: ['./ac-constraint-hierarchy.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {

    'class': 'ac-constraint-hierarchy'

  }
})
export class ACConstraintHierarchyComponent {

  @Input()
  assetClassGroup: AssetClassGroup;

  @Input()
  chartData: ACConstraintChartData;

  collapse(acg: AssetClassGroup) {

    if (acg.assetClass)
      return;

    acg.metadata.constraintCollapsed = !acg.metadata.constraintCollapsed;
  }
}
