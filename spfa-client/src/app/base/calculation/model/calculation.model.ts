import {RiskFactorGroup, RiskFactor} from "../../risk-factor/risk-factor.model";
import {
  AssetClassGroup, DualConstraint, AssetClass, AllocationConstraint, Portfolio,
  AssetClassGroupUpdate
} from "../../asset-class/asset-class.model";
import {BusinessUnit, LegalEntity} from "../../business-unit/business-unit.model";
import {SSTRatio} from "./sst-ratio.model";
import {DurationConstraint} from "../../duration-constraint/duration-constraint.model";
import {SpRatio} from "@app/base/calculation/model/sp-ratio-model";
export class Calculation {

  id: number;
  name: string;
  description: string;
  srGroup: boolean;
  businessUnitGroupIds: number[];
  legalEntityIds: number[];
  capitalMeasure: string;
  returnTarget: string;
  cob: Date | string;
  periodStart: Date | string;
  periodEnd: Date | string;
  createdBy: string;
  createdDate: Date;

  businessUnitGroups: BusinessUnit[];
  legalEntities: LegalEntity[];
  assetClassGroups: AssetClassGroup[];
  riskFactorGroups: RiskFactorGroup[];

  assetClasses: AssetClass[]; // helper structure, extracted from acg hierarchy
  assetClassMap: Map<String,AssetClass>; // helper structure, extracted from acg hierarchy, AC name is the key
  flatAssetClassGroups: AssetClassGroup[]; // helper structure, extracted from acg hierarchy
  riskFactors: RiskFactor[]; // helper structure, extracted from rfg hierarchy
  riskFactorMap: Map<String,RiskFactor>; // helper structure, extracted from rfg hierarchy, RF name is the key
  flatRiskFactorGroups: RiskFactorGroup[]; // helper structure, extracted from rfg hierarchy
  allocationConstraints: AllocationConstraint[]; // helper structure, extracted from acg hierarchy
  dualConstraints: DualConstraint[];
  durationConstraints: DurationConstraint[];
  flatDurationConstraints: DurationConstraint[];

  efficientPortfoliosUser: Portfolio[];
  efficientPortfoliosMarket: Portfolio[];
  efficientPortfoliosIs: Portfolio[];
  currentPortfolio: Portfolio;
  userDefinedPortfolio: Portfolio;
  optimalPortfolio: Portfolio;

  sstRatio: SSTRatio;

  spRatio: SpRatio;
  spRatioUpperBound: number;
  spRatioUpperBoundSaved: number;

  navSum: number;
  liabilitySum: number;

  ioBundle: InputOutputBundle;

  readOnly:boolean = false;
}

export class CalculationUpdate {

  assetClasses: AssetClass[];
  assetClassGroups: AssetClassGroupUpdate[];
  allocationConstraints: AllocationConstraint[];
  riskFactors: RiskFactor[];
  sstRatio: SSTRatio;
  spRatioUpperBound: number;
}

export class CalculationApply extends CalculationUpdate{
  efficientPortfoliosMarket: Portfolio[];
  efficientPortfoliosUser: Portfolio[];
  efficientPortfoliosIs: Portfolio[];
  currentPortfolio: Portfolio;
  userDefinedPortfolio: Portfolio;
}

/**
 * Currently not needed, but the interface is prepared also on BE for future needs.
 */
export class InputOutputBundle {
  version: number;
}
