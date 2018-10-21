import {Portfolio} from "../../asset-class/asset-class.model";
import {RiskFactor} from "../../risk-factor/risk-factor.model";
export class SensitivityAnalysisRequest {
  optimalPortfolio: Portfolio;
  riskFactor: RiskFactor;     // only adjusted values
}

export class SensitivityAnalysisResponse {
  sensitivityAnalysisLevels: SensitivityAnalysisLevel[];     // only adjusted values
}

export class SensitivityAnalysisLevel {
  level: number;
  acNavPercentageMap: number[];
}
