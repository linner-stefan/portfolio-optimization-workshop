import {BubbleChartConfig} from "@app/shared/charts/bubble-chart/config/bubble-chart-config";
import {ValueUtil} from "@app/shared/value.util";
import {BubbleChartTypeEnum} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
import * as math from "mathjs";

/**
 * Created by Stefan Linner on 26/10/2017.
 */
export class AcViewsConfig implements BubbleChartConfig {
  readonly title = "Excess return & Volatility";
  readonly type = BubbleChartTypeEnum.AcViews;
  readonly axisXLabel = "Excess return volatility";
  readonly axisYLabel = "Excess return";
  readonly axisXFormat = d => d+"%";
  readonly axisYFormat = d => d+"%";
  readonly radiusPrimaryFormat = d => math.round( d * 100, this.rounding )+"%";
  readonly radiusSecondaryFormat = ValueUtil.formatBillion;
  readonly rounding = 2;
  readonly nothingToDisplayMessage = '';
}
