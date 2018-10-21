import {BubbleChartTypeEnum} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
/**
 * Created by Stefan Linner on 26/10/2017.
 */
export interface BubbleChartConfig {
  readonly title: string;
  readonly type: BubbleChartTypeEnum;
  readonly axisXLabel: string;
  readonly axisYLabel: string;
  readonly axisYTypes?: string[];
  readonly tooltipLabel?: string;
  readonly axisXFormat: (domainValue: any, index: number) => string;
  readonly axisYFormat: (domainValue: any, index: number) => string;
  readonly radiusPrimaryFormat: Function;
  readonly radiusSecondaryFormat?: Function;
  readonly rounding: number;
  readonly nothingToDisplayMessage: string;
}
