import {
  Component,
  ViewEncapsulation, Input
} from "@angular/core";
import {ACLiabilityChartData} from "./ac-liability-chart.model";
import {AssetClassGroup} from "../../../../base/asset-class/asset-class.model";

@Component({

  selector: 'ac-liability-hierarchy',
  templateUrl: './ac-liability-hierarchy.component.html',
  styleUrls: ['./ac-liability-hierarchy.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {

    'class': 'ac-liability-hierarchy'

  }
})
export class ACLiabilityHierarchyComponent {

  @Input()
  chartData: ACLiabilityChartData;

  @Input()
  assetClassGroup: AssetClassGroup;

  collapse(acg: AssetClassGroup) {

    if (acg.assetClass)
      return;

    acg.metadata.liabilityCollapsed = !acg.metadata.liabilityCollapsed;
  }
}
