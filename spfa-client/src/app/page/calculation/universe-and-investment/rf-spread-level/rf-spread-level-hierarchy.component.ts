import {ViewEncapsulation, Input, Component} from "@angular/core";
import {RiskFactorGroup, RiskFactor} from "../../../../base/risk-factor/risk-factor.model";
import {RFSpreadLevelChartData} from "./rf-spread-level-chart.model";
import {CalculationUtil} from "../../../../base/calculation/calculation.util";
@Component({

  selector: 'rf-spread-level-hierarchy',
  templateUrl: 'rf-spread-level-hierarchy.component.html',
  styleUrls: ['rf-spread-level-hierarchy.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RFSpreadLevelHierarchyComponent {

  @Input()
  riskFactorGroup: RiskFactorGroup;

  @Input()
  chartData: RFSpreadLevelChartData;

  collapse(riskFactorGroup: RiskFactorGroup) {

    riskFactorGroup.metadata.spreadLevelCollapsed = !riskFactorGroup.metadata.spreadLevelCollapsed;
  }

  undo(riskFactor: RiskFactor) {

    CalculationUtil.setOneRiskFactorUserDefaults( riskFactor );
    this.chartData.onRefresh.next( riskFactor );
    this.chartData.onChange.next( riskFactor );
  }
}
