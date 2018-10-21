import {AssetClassType} from "../asset-class/asset-class.model";
export class RiskFactorGroup {

  id: number;
  name: string;
  level: number;
  subGroups?: RiskFactorGroup[];
  parent: RiskFactorGroup;      // populated on FE
  riskFactor?: RiskFactor;
  metadata?: RiskFactorMetadata;
}

export class RiskFactor {

  id: number;
  name: string;

  group: RiskFactorGroup;     // corresponding RF group, set on FE
  rootGroup: RiskFactorGroup; // corresponding root RF group, set on FE

  marketData: number;
  adjustedMarketData: number;
  userAdjustedMarketData: number;

  adjustedLevel: number;
  userAdjustedLevel: number;

  volatility: number;
  adjustedVolatility: number;
  userAdjustedVolatility: number;

  unit: RiskFactorUnit;
  type: AssetClassType;
  investmentViewType: RiskFactorISType;

  scaleFactor: number;
  totalReturn: number;

  investmentViews: InvestmentView[];
  agregatedInvestmentViews: InvestmentView[];

}

export type RiskFactorUnit = 'ABS' | 'BP';
export type RiskFactorISType = 'Total' | 'Change';

export interface RiskFactorMetadata {

  /*
   is group collapsed?
   */
  spreadLevelCollapsed: boolean;
}

export class InvestmentView {

  value: number;
  agregatedValue: number;
  yearLabel:string;
  year:string;
  scaledPosition: number;
}
