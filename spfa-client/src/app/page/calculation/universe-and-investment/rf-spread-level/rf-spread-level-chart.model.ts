import {EventEmitter} from "@angular/core";
import {RiskFactor} from "../../../../base/risk-factor/risk-factor.model";

export class RFSpreadLevelChartData {

  onChange: EventEmitter<any>;
  onRefresh: EventEmitter<any>;

  onSelectMahalanobisAxisX: EventEmitter<RiskFactor>;
  onSelectMahalanobisAxisY: EventEmitter<RiskFactor>;
  onSelectMahalanobisAxis: EventEmitter<any>;
}
