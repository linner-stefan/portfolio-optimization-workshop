import {Component, Input, ViewEncapsulation} from "@angular/core";
import {ACConstraintChartData} from "../ac-constraint-chart.model";
import {DualConstraint, AssetClassGroup} from "../../../../../base/asset-class/asset-class.model";
@Component({

  selector: 'ac-constraint-notifications',
  templateUrl: './ac-constraint-notifications.component.html',
  styleUrls: ['./ac-constraint-notifications.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintNotificationsComponent {

  @Input()
  chartData: ACConstraintChartData;

  @Input()
  dualConstraints: DualConstraint[];

  @Input()
  assetClassGroups: AssetClassGroup[];
}
