import {BubbleChartDataAggregation} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
import {AssetClass, AssetClassGroup} from "@app/base/asset-class/asset-class.model";
/**
 * Created by Stefan Linner on 25/10/2017.
 */
export class AcViewsDataAggregation implements BubbleChartDataAggregation{
  private n: number = 0;
  readonly needsSecondRun: boolean = true;

  private volatility: number = 0;
  private volatilityReturn: number = 0;

  private volatilityReturnWeight: number = 0;
  /**
   * value aggregated in second run
   * @type {number}
   */
  private volatilityReturnWeighted: number = 0;

  private nav: number = 0;
  private ctr: number = 0;

  constructor(
    private totals: AcViewsTotals   // shared and updated across all instances
  ){}

  initializeFromAc(ac: AssetClass ){
    this.volatilityReturn = ac.marketData.volatilityReturn;
    this.volatilityReturnWeight = ac.marketCap;
    this.volatilityReturnWeighted = 0;
    this.ctr = ac.marketData.ctr;
    this.nav = ac.marketData.nav;

    this.totals.ctr += this.ctr;

    this.n = 1;
  }

  initializeFromGroup(acg: AssetClassGroup): void {
    this.volatility = acg.volatility;
  }

  clearBeforeSecondRun(): void {
    this.volatilityReturnWeighted = 0;
  }

  add(values: AcViewsDataAggregation) {
    this.volatilityReturnWeight += values.volatilityReturnWeight;
    this.nav += values.nav;

    this.ctr += values.ctr;

    this.n++;
  }

  doAverage(): void {
    this.volatilityReturn = this.volatilityReturnWeighted;
  }

  secondRun(value: AcViewsDataAggregation){
    let volatilityReturnWeightInPercentage = value.volatilityReturnWeight / this.volatilityReturnWeight;
    this.volatilityReturnWeighted += volatilityReturnWeightInPercentage * value.volatilityReturn;
  }

  x():number{
    return this.volatility * 100;
  }
  y():number{
    if ( this.n == 1 ){
      return this.volatilityReturn * 100;
    }
    return this.volatilityReturnWeighted * 100;
  }
  radiusPrimary():number{
    return this.ctr / this.totals.ctr;
  }
  radiusSecondary():number{
    return this.nav;
  }

}

export class AcViewsTotals {
  ctr = 0;
}
