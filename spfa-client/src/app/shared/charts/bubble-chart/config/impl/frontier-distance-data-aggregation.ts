import {BubbleChartDataAggregation} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
import {AssetClass, AssetClassGroup} from "@app/base/asset-class/asset-class.model";
import {CalculationUtil} from "@app/base/calculation/calculation.util";
/**
 * Created by Stefan Linner on 25/10/2017.
 */

export class FrontierDistanceDataAggregation implements BubbleChartDataAggregation{
  private n: number = 0;
  readonly needsSecondRun: boolean = false;
  private prospectiveReturnsWeightedCurrent: number = 0;
  private prospectiveReturnsWeightedUserDefined: number = 0;

  private navCurrent: number = 0;
  private navUserDefined: number = 0;
  private ctrCurrent: number = 0;
  private ctrUserDefined: number = 0;

  initializeFromAc(ac: AssetClass): void {
    const currentPortfolioAllocation = CalculationUtil.getCurrentPortfolioAllocation( ac.portfolioAllocations );
    const userDefinedPortfolioAllocation = CalculationUtil.getUserDefinedPortfolioAllocation( ac.portfolioAllocations );

    const prospectiveReturn = ac.prospectiveReturn ? ac.prospectiveReturn : 0;

    this.prospectiveReturnsWeightedCurrent = prospectiveReturn * currentPortfolioAllocation.navPercentage;
    this.prospectiveReturnsWeightedUserDefined = prospectiveReturn * userDefinedPortfolioAllocation.navPercentage;

    this.ctrCurrent = currentPortfolioAllocation.ctr;
    this.ctrUserDefined = userDefinedPortfolioAllocation.ctr;

    this.navCurrent = currentPortfolioAllocation.navTotal;
    this.navUserDefined = userDefinedPortfolioAllocation.navTotal;

    this.n = 1;
  }


  initializeFromGroup(ac: AssetClassGroup): void {
  }

  clearBeforeSecondRun(): void {
  }

  add(values: FrontierDistanceDataAggregation): void {
    this.prospectiveReturnsWeightedCurrent += values.prospectiveReturnsWeightedCurrent;
    this.prospectiveReturnsWeightedUserDefined += values.prospectiveReturnsWeightedUserDefined;

    this.ctrCurrent += values.ctrCurrent;
    this.ctrUserDefined += values.ctrUserDefined;

    this.navCurrent += values.navCurrent;
    this.navUserDefined += values.navUserDefined;

    this.n++;
  }

  doAverage(): void {
  }

  secondRun(value: FrontierDistanceDataAggregation) {
  }

  /**
   * @returns {number} change in risk in absolute percentage
   */
  x(): number {
    return ( this.ctrUserDefined - this.ctrCurrent ) * 100;
  }

  /**
   * @param type return type.
   * @returns {number} return in absolute percentage
   */
  y(type?: number): number {
    const retVal = this.prospectiveReturnsWeightedUserDefined - this.prospectiveReturnsWeightedCurrent;
    return retVal * 100;
  }

  radiusPrimary(): number {
    return this.navUserDefined - this.navCurrent;
  }

  radiusSecondary(): number {
    return undefined;
  }
}
