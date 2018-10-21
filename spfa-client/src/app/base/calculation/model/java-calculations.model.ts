import {Calculation} from "@app/base/calculation/model/calculation.model";
import {EventEmitter} from "@angular/core";
import {
  Portfolio, PortfolioAllocation, AssetClass, AssetClassGroupUpdate,
  PortfolioAllocationDto
} from "@app/base/asset-class/asset-class.model";

abstract class JavaCalculationsUpdate {
  refreshHandler: EventEmitter<any>;
  calculation: Calculation;
}

export class PortfolioAttributesUpdate extends JavaCalculationsUpdate{
  data: PortfolioAttributesUpdateInDto;
}

export class PortfolioCtrUpdate extends JavaCalculationsUpdate {
  data: PortfolioCtrUpdateInDto;
  portfolio: Portfolio;
}

export class PortfolioAttributesUpdateInDto {
  assetClasses: Object[];
}

export class PortfolioAttributesUpdateOutDto {
  userDefinedTrackingError: number;
  userDefinedReturn: number;
  currentTrackingError: number;
  currentReturn: number;
}

export class PortfolioCtrUpdateInDto {
  portfolioAllocations: PortfolioAllocationDto[];  // only necessary attributes are filled
}

export class PortfolioCtrUpdateOutDto {
  assetClassToCtrMap: number[];
}

export class RiskFactorChangeOutDto {
  assetClasses: AssetClass[];
  assetClassGroups: AssetClassGroupUpdate[];
}
