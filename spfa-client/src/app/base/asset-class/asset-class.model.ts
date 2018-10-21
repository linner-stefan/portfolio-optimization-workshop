import {RiskFactor} from "../risk-factor/risk-factor.model";
export type AssetClassType = 'FI' | 'FIGOV' | 'FICR' | 'ILS' | 'EQ';

export class AssetClass {

  id: number;
  name: string;
  group: AssetClassGroup;
  type: AssetClassType;
  totalReturn: number;
  scaleFactor: number;
  mrpOasFactor: number;
  marketCap: number;
  marketData: MarketData;
  selected: boolean;
  userSelected: boolean;

  prospectiveReturn: number;
  investmentViewReturn: number;
  marketReturn: number;

  /**
   * S&P Asset Class Risk Charge (floating point percentage)
   */
  spAssetRiskCharge: number;

  portfolioAllocations: Array<PortfolioAllocation>;  // rest on FE to point to the same object as Portfolio.allocations or Portfolio.allocationsMap

  riskFactors: RiskFactor[];
}

export class AllocationConstraint {

  id: number;

  lowerBound: number;
  adjustedLowerBound: number;
  userAdjustedLowerBound: number;

  upperBound: number;
  adjustedUpperBound: number;
  userAdjustedUpperBound: number;

  aggregation?: boolean;
  adjustedAggregation?: boolean;
  userAdjustedAggregation?: boolean;
}

export class DualConstraint {

  id: number;

  lowerBound: number;
  upperBound: number;

  assetClassGroupId1: number;
  assetClassGroupId2: number;

  assetClassGroup1: AssetClassGroup;
  assetClassGroup2: AssetClassGroup;
}

export class Portfolio {

  id: number;
  calculationId: number;
  label: string;
  setLabel: string;
  allocations: PortfolioAllocation[];
  /**
   * Mapped on FE. Keys are AC ids from portfolio allocation (pa.assetClassId).
   */
  allocationsMap: Map<number,PortfolioAllocation>;

  portfolioReturn: number;
  portfolioReturnApplied: number;     // previously applied value, used for Undo Changes purposes

  trackingError: number;
  trackingErrorApplied: number;       // previously applied value, used for Undo Changes purposes
  optimalTrackingError?: number;
}

export class PortfolioAllocation {

  id: number;
  portfolioId: number;
  assetClassId: number;
  assetClass:AssetClass;    // mapped on front-end
  portfolioLabel: string;
  portfolioSetLabel: string;

  /*
    all adjustments in p4 chart are stored here for user defined portfolio
   */
  navTotal: number;
  navPercentage: number;
  ctr: number;

  /*
    previous allocations (used to restore local changes) for user defined portfolio
   */
  previousNavPercentage?: number;
  previousNavTotal?: number;
  previousCtr: number;

}

export class PortfolioAllocationDto {

  id: number;
  portfolioId: number;
  assetClassId: number;
  assetClassName: string;
  portfolioLabel: string;
  portfolioSetLabel: string;

  navTotal: number;
  navPercentage: number;
  ctr: number;
}

export class AssetClassGroup {

  id: number;
  definitionId: number;
  rootId: number; // assigned on FE while parsing
  name: string;
  level: number;

  volatility: number;

  parent: AssetClassGroup; // assigned on FE while parsing
  subClasses: AssetClassGroup[];
  assetClass?: AssetClass;
  allocationConstraint?: AllocationConstraint;

  metadata: AssetClassGroupMetadata;
}

export class AssetClassGroupUpdate {
  id: number;
  name: string;

  volatility: number;
}

export class MarketData {
  /**
   * AC tree structure leaves have original calculated values, parents have averages
   */
  volatility: number;
  /**
   * AC tree structure leaves have original calculated values, parents have averages
   */
  volatilityReturn: number;
  /**
   * CtR - Contribution to Risk
   */
  ctr: number;

  liability: number;
  adjustedLiability: number;
  userAdjustedLiability: number;

  /**
   * NAV - Net Asset Value
   */
  nav: number;
}

export interface AssetClassGroupMetadata {

  /*
   * is constraint collapsed?
   */
  constraintCollapsed: boolean;

  /**
   * is liability collapsed?
   */
  liabilityCollapsed: boolean;

  /*
    sum of allocations for groups
   */
  allocationSum: number;

  /*
   sum of allocations of current portfolio for groups
   */
  allocationCurrentSum: number;

  /*
   sum of allocations of optimal portfolio for groups
   */
  allocationOptimalSum: number;

  /*
    sum of liabilities for groups
   */
  liabilitySum: number; // for ac and groups

  /*
    sum of liabilities of current portfolio for groups
   */
  liabilityCurrentSum: number; // for ac and groups
}

export class AssetClassSelect {

  selected: boolean;
  assetClassIds: number[];
}

export class CurrencyInfo {

  currency: string;
  total: number;
}
