import {AssetClass, AssetClassGroup} from "@app/base/asset-class/asset-class.model";
import {AcViewsDataAggregation, AcViewsTotals} from "@app/shared/charts/bubble-chart/config/impl/ac-views-data-aggregation";
import {FrontierDistanceDataAggregation} from "@app/shared/charts/bubble-chart/config/impl/frontier-distance-data-aggregation";

/**
 * Created by Stefan Linner on 24/10/2017.
 */

export enum BubbleChartTypeEnum {
  AcViews,
  FrontierDistance
}

export class BubbleChartDataAggregationFactory {

  private acViewsTotals: AcViewsTotals = new AcViewsTotals();

  createDataAggregation( type: BubbleChartTypeEnum ): BubbleChartDataAggregation {
    if ( type === BubbleChartTypeEnum.AcViews ){
      return new AcViewsDataAggregation( this.acViewsTotals );
    }
    if ( type === BubbleChartTypeEnum.FrontierDistance ){
      return new FrontierDistanceDataAggregation();
    }
  }
}

export interface BubbleChartDataAggregation {

  readonly needsSecondRun:boolean;

  initializeFromAc(ac: AssetClass):void;
  initializeFromGroup(ac: AssetClassGroup):void;
  add(values: BubbleChartDataAggregation):void;
  doAverage():void;

  clearBeforeSecondRun():void;
  secondRun(value:BubbleChartDataAggregation);

  x(type?:number):number;
  y(type?:number):number;
  radiusPrimary():number;
  radiusSecondary():number;
}
