import {AssetClassGroup} from "@app/base/asset-class/asset-class.model";
import * as math from "mathjs";
import {
  BubbleChartDataAggregationFactory,
  BubbleChartTypeEnum, BubbleChartDataAggregation
} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";

export class BubbleChartDatum{

  x(type?:number): number {
    return this.aggregatedValues.x(type);
  }
  y(type?:number): number {
    return this.aggregatedValues.y(type);
  }
  get radiusPrimary(): number {
    return this.aggregatedValues.radiusPrimary();
  }
  get radiusSecondary(): number {
    return this.aggregatedValues.radiusSecondary();
  }

  aggregatedValues: BubbleChartDataAggregation;

  /**
   * Category represents top level asset class and is used e.g. in circle coloring based on asset category (top level parent).
   */
  category: string;

  /**
   * Has selected leaf or is selected leaf
   * @type {boolean}
   */
  hasSelectedLeaf: boolean = true;

  // helpers for Voronoi labels
  voronoiPolygon?: any;
  voronoiPolygonCentroid?: [number,number];

  constructor(
    public assetClassGroup: AssetClassGroup
  ){}

  /**
   * Index of this object in displayed AC's array for chart data. If empty, AC is not displayed.
   */
  private indexInChartData?: number;
  getDisplayedIndex(): number{
    return this.indexInChartData;
  }
  isDisplayed(): boolean{
    return typeof this.indexInChartData === "number" && this.indexInChartData >= 0;
  }
  /**
   * @param index - index in displayed chart data array, set as null, or false when removing from chart data
   */
  setDisplayed(index: any){
    if ( Number.isInteger(index) && index >= 0 )
      this.indexInChartData = index;
    else
      this.indexInChartData = null;
  }

  get id(): number{
    return this.assetClassGroup.id;
  }
  get name(): string{
    return this.assetClassGroup.name;
  }

  /**
   * @param useSecondary if true, returns radius value as for example as NAV, otherwise returns value as CtR
   * @returns {number} radius value, can be negative
   */
  radius(useSecondary: boolean): number{
    return useSecondary ? this.radiusSecondary : this.radiusPrimary;
  }
  radiusRounded(useSecondary: boolean, decimals: number ): number{
    let retVal: number = useSecondary ? this.radiusSecondary : this.radiusPrimary;
    return math.round( retVal, decimals ) as number;
  }

}
